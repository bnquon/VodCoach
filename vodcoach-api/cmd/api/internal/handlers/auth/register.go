package auth

import (
	"errors"
	"net/http"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
)

type RegisterHandler struct {
	authService *services.AuthService
}

type RegisterRequestBody struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func NewRegisterHandler(authService *services.AuthService) *RegisterHandler {
	return &RegisterHandler{
		authService: authService,
	}
}

func (h *RegisterHandler) Register(c *gin.Context) {
	var body RegisterRequestBody

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing email/password field"})
		return
	}

	response, err := h.authService.Register(c.Request.Context(), body.Email, body.Password)
	if err != nil {
		if errors.Is(err, services.ErrWeakPassword) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 7 characters and include an uppercase letter and a symbol"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	c.JSON(http.StatusCreated, response)
}
