package services

import (
	"context"
	"errors"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrWeakPassword       = errors.New("password does not meet strength requirements")
)

type AuthService struct {
	userRepository *repository.UserRepository
}

func NewAuthService(userRepository *repository.UserRepository) *AuthService {
	return &AuthService{
		userRepository: userRepository,
	}
}

type UserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

func (s *AuthService) Register(ctx context.Context, email string, password string) (*AuthResponse, error) {
	if !auth.ValidatePasswordStrength(password) {
		return nil, ErrWeakPassword
	}

	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}

	createdID, err := s.userRepository.CreateUser(ctx, email, hashedPassword)
	if err != nil {
		return nil, err
	}

	token, err := auth.GenerateToken(createdID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User: UserResponse{
			ID:    createdID,
			Email: email,
		},
	}, nil
}

func (s *AuthService) Login(ctx context.Context, email string, password string) (*AuthResponse, error) {
	user, err := s.userRepository.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := auth.VerifyPassword(user.PasswordHash, password); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User: UserResponse{
			ID:    user.ID,
			Email: user.Email,
		},
	}, nil
}
