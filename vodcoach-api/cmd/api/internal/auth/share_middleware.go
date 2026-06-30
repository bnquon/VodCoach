package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const ShareClaimsContextKey = "shareClaims"

func ShareMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header is required"})
			return
		}

		tokenString, ok := strings.CutPrefix(authHeader, "Bearer ")
		if !ok || tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header must use Bearer token"})
			return
		}

		claims, err := ValidateShareToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired share token"})
			return
		}

		c.Set(ShareClaimsContextKey, claims)
		c.Next()
	}
}

func GetShareClaims(c *gin.Context) (*ShareClaims, bool) {
	claims, ok := c.Get(ShareClaimsContextKey)
	if !ok {
		return nil, false
	}

	shareClaims, ok := claims.(*ShareClaims)
	return shareClaims, ok
}
