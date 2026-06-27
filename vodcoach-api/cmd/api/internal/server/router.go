package server

import (
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/health"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(pool *pgxpool.Pool) *gin.Engine {
	router := gin.Default()

	appHealthHandler := health.NewAppHealthHandler()
	dbHealthHandler := health.NewDBHealthHandler(pool)

	router.GET("/health", appHealthHandler.Health)
	router.GET("/health/db", dbHealthHandler.Health)

	return router
}