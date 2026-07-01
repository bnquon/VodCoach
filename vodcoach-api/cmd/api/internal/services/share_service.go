package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
)

const (
	SharePermissionView    = "view"
	SharePermissionComment = "comment"
)

var (
	ErrInvalidSharePermission = errors.New("invalid share permission")
	ErrShareAccessDenied      = errors.New("share access denied")
	ErrInvalidGuestName       = errors.New("invalid guest name")
)

type ShareService struct {
	vodRepository      *repository.VodRepository
	vodShareRepository *repository.VodShareRepository
	noteRepository     *repository.NoteRepository
	drawingRepository  *repository.DrawingRepository
	storageService     *StorageService
}

type CreateVodShareResult struct {
	Share *repository.VodShare
	Token string
}

type ShareSessionResult struct {
	Token     string
	Share     *repository.VodShare
	GuestName string
}

func NewShareService(
	vodRepository *repository.VodRepository,
	vodShareRepository *repository.VodShareRepository,
	noteRepository *repository.NoteRepository,
	drawingRepository *repository.DrawingRepository,
	storageService *StorageService,
) *ShareService {
	return &ShareService{
		vodRepository:      vodRepository,
		vodShareRepository: vodShareRepository,
		noteRepository:     noteRepository,
		drawingRepository:  drawingRepository,
		storageService:     storageService,
	}
}

func (s *ShareService) CreateShare(ctx context.Context, vodID string, ownerUserID string, permission string) (*CreateVodShareResult, error) {
	if !isValidSharePermission(permission) {
		return nil, ErrInvalidSharePermission
	}

	ownsVod, err := s.vodRepository.UserOwnsVod(ctx, vodID, ownerUserID)
	if err != nil {
		return nil, err
	}
	if !ownsVod {
		return nil, ErrVodAccessDenied
	}

	if err := s.vodShareRepository.RevokeActiveByVodOwnerAndPermission(ctx, vodID, ownerUserID, permission); err != nil {
		return nil, err
	}

	token, err := newShareToken()
	if err != nil {
		return nil, err
	}

	share, err := s.vodShareRepository.Create(ctx, repository.CreateVodShareParams{
		VodID:       vodID,
		OwnerUserID: ownerUserID,
		TokenHash:   hashShareToken(token),
		Permission:  permission,
	})
	if err != nil {
		return nil, err
	}

	return &CreateVodShareResult{
		Share: share,
		Token: token,
	}, nil
}

func (s *ShareService) GetShares(ctx context.Context, vodID string, ownerUserID string) ([]repository.VodShare, error) {
	ownsVod, err := s.vodRepository.UserOwnsVod(ctx, vodID, ownerUserID)
	if err != nil {
		return nil, err
	}
	if !ownsVod {
		return nil, ErrVodAccessDenied
	}

	return s.vodShareRepository.GetByVodIDAndOwnerUserID(ctx, vodID, ownerUserID)
}

func (s *ShareService) RevokeShare(ctx context.Context, shareID string, ownerUserID string) error {
	revoked, err := s.vodShareRepository.Revoke(ctx, shareID, ownerUserID)
	if err != nil {
		return err
	}
	if !revoked {
		return ErrShareAccessDenied
	}

	return nil
}

func (s *ShareService) CreateShareSession(ctx context.Context, shareToken string, guestName string) (*ShareSessionResult, error) {
	trimmedGuestName := strings.TrimSpace(guestName)
	if trimmedGuestName == "" {
		return nil, ErrInvalidGuestName
	}

	share, err := s.vodShareRepository.GetActiveByTokenHash(ctx, hashShareToken(shareToken))
	if err != nil {
		if repository.IsVodShareNotFound(err) {
			return nil, ErrShareAccessDenied
		}

		return nil, err
	}

	sessionToken, err := auth.GenerateShareToken(share.ID, share.VodID, share.Permission, trimmedGuestName)
	if err != nil {
		return nil, err
	}

	return &ShareSessionResult{
		Token:     sessionToken,
		Share:     share,
		GuestName: trimmedGuestName,
	}, nil
}

func (s *ShareService) ValidateShareClaims(ctx context.Context, claims *auth.ShareClaims) (*repository.VodShare, error) {
	share, err := s.vodShareRepository.GetActiveByID(ctx, claims.ShareID)
	if err != nil {
		if repository.IsVodShareNotFound(err) {
			return nil, ErrShareAccessDenied
		}

		return nil, err
	}

	if share.VodID != claims.VodID || share.Permission != claims.Permission {
		return nil, ErrShareAccessDenied
	}

	return share, nil
}

func (s *ShareService) GetSharedVod(ctx context.Context, claims *auth.ShareClaims) (*repository.Vod, error) {
	if _, err := s.ValidateShareClaims(ctx, claims); err != nil {
		return nil, err
	}

	return s.vodRepository.GetByID(ctx, claims.VodID)
}

func (s *ShareService) CreateSharedPlaybackURL(ctx context.Context, claims *auth.ShareClaims) (string, error) {
	if _, err := s.ValidateShareClaims(ctx, claims); err != nil {
		return "", err
	}

	vod, err := s.vodRepository.GetByID(ctx, claims.VodID)
	if err != nil {
		return "", err
	}

	return s.storageService.CreatePresignedGetURL(ctx, vod.OriginalStorageKey, time.Hour)
}

func (s *ShareService) GetSharedAnnotations(ctx context.Context, claims *auth.ShareClaims) (*Annotations, error) {
	if _, err := s.ValidateShareClaims(ctx, claims); err != nil {
		return nil, err
	}

	notes, err := s.noteRepository.GetNotesByVodID(ctx, claims.VodID)
	if err != nil {
		return nil, err
	}

	drawings, err := s.drawingRepository.GetDrawingsByVodID(ctx, claims.VodID)
	if err != nil {
		return nil, err
	}

	return &Annotations{
		Notes:    notes,
		Drawings: drawings,
	}, nil
}

func (s *ShareService) CreateSharedNote(ctx context.Context, claims *auth.ShareClaims, params repository.CreateNoteParams) (*repository.Note, error) {
	if err := requireCommentPermission(claims); err != nil {
		return nil, err
	}
	if _, err := s.ValidateShareClaims(ctx, claims); err != nil {
		return nil, err
	}

	params.VodID = claims.VodID
	params.UserID = nil
	params.GuestName = &claims.GuestName

	return s.noteRepository.CreateNote(ctx, params)
}

func (s *ShareService) CreateSharedDrawings(ctx context.Context, claims *auth.ShareClaims, params []repository.CreateDrawingParams) ([]repository.Drawing, error) {
	if err := requireCommentPermission(claims); err != nil {
		return nil, err
	}
	if _, err := s.ValidateShareClaims(ctx, claims); err != nil {
		return nil, err
	}

	for index := range params {
		params[index].VodID = claims.VodID
		params[index].UserID = nil
		params[index].GuestName = &claims.GuestName
	}

	return s.drawingRepository.CreateDrawings(ctx, params)
}

func isValidSharePermission(permission string) bool {
	return permission == SharePermissionView || permission == SharePermissionComment
}

func requireCommentPermission(claims *auth.ShareClaims) error {
	if claims.Permission != SharePermissionComment {
		return ErrShareAccessDenied
	}

	return nil
}

func newShareToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func hashShareToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
