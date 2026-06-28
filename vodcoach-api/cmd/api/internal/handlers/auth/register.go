package auth

import (
	"net/http"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
)

type RegisterUserHandler struct {
	authService *services.AuthService
}

type RegisterUserRequestBody struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func NewRegisterUserHandler(authService *services.AuthService) *RegisterUserHandler {
	return &RegisterUserHandler{
		authService: authService,
	}
}

func (h *RegisterUserHandler) RegisterUser(c *gin.Context) {
	var body RegisterUserRequestBody

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing email/password field"})
		return
	}

	response, err := h.authService.Register(c.Request.Context(), body.Email, body.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	c.JSON(http.StatusCreated, response)
}
