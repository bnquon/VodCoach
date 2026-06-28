package server

import (
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/health"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(pool *pgxpool.Pool) *gin.Engine {
	router := gin.Default()

	appHealthHandler := health.NewAppHealthHandler()
	dbHealthHandler := health.NewDBHealthHandler(pool)

	usersRepository := repository.NewUsersRepository(pool)

	authService := services.NewAuthService(usersRepository)

	registerUserHandler := auth.NewRegisterUserHandler(authService)
	loginUserHandler := auth.NewLoginUserHandler(authService)

	router.GET("/health", appHealthHandler.Health)
	router.GET("/health/db", dbHealthHandler.Health)

	router.POST("/register", registerUserHandler.RegisterUser)
	router.POST("/login", loginUserHandler.LoginUser)

	return router
}
