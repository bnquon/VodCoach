package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AppHealthHandler struct{}

func NewAppHealthHandler() *AppHealthHandler {
	return &AppHealthHandler{}
}

func (h *AppHealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"service": "vodcoach-api",
	})
}
