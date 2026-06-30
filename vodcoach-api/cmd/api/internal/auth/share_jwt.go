package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const shareJWTTTL = 4 * time.Hour

type ShareClaims struct {
	ShareID    string `json:"share_id"`
	VodID      string `json:"vod_id"`
	Permission string `json:"permission"`
	GuestName  string `json:"guest_name"`
	jwt.RegisteredClaims
}

func GenerateShareToken(shareID string, vodID string, permission string, guestName string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", errors.New("JWT_SECRET environment variable is required")
	}

	claims := ShareClaims{
		ShareID:    shareID,
		VodID:      vodID,
		Permission: permission,
		GuestName:  guestName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(shareJWTTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ValidateShareToken(tokenString string) (*ShareClaims, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, errors.New("JWT_SECRET environment variable is required")
	}

	token, err := jwt.ParseWithClaims(tokenString, &ShareClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected JWT signing method")
		}

		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*ShareClaims)
	if !ok || !token.Valid || claims.ShareID == "" || claims.VodID == "" || claims.Permission == "" || claims.GuestName == "" {
		return nil, errors.New("invalid share token")
	}

	return claims, nil
}
