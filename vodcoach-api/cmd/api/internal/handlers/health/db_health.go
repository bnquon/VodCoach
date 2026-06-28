package health

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DBHealthHandler struct {
	pool *pgxpool.Pool
}

func NewDBHealthHandler(pool *pgxpool.Pool) *DBHealthHandler {
	return &DBHealthHandler{
		pool: pool,
	}
}

func (h *DBHealthHandler) Health(c *gin.Context) {
	if err := h.pool.Ping(c.Request.Context()); err != nil {
		log.Printf("database health check failed: %v", err)

		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "error",
			"service": "vodcoach-db",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "vodcoach-db",
	})
}
