package auth

import (
	"errors"
	"net/http"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
)

type LoginUserHandler struct {
	authService *services.AuthService
}

type LoginUserRequestBody struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func NewLoginUserHandler(authService *services.AuthService) *LoginUserHandler {
	return &LoginUserHandler{
		authService: authService,
	}
}

func (h *LoginUserHandler) LoginUser(c *gin.Context) {
	var body LoginUserRequestBody

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing email/password field"})
		return
	}

	response, err := h.authService.Login(c.Request.Context(), body.Email, body.Password)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to login user"})
		return
	}

	c.JSON(http.StatusOK, response)
}
