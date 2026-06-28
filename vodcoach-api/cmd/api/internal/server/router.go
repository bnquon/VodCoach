package server

import (
	"net/http"

	authmiddleware "github.com/bnquon/vodcoach-api/cmd/api/internal/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/health"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/notes"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(pool *pgxpool.Pool) *gin.Engine {
	router := gin.Default()
	router.Use(corsMiddleware())

	appHealthHandler := health.NewAppHealthHandler()
	dbHealthHandler := health.NewDBHealthHandler(pool)

	userRepository := repository.NewUserRepository(pool)
	noteRepository := repository.NewNoteRepository(pool)
	drawingRepository := repository.NewDrawingRepository(pool)
	vodRepository := repository.NewVodRepository(pool)

	authService := services.NewAuthService(userRepository)
	noteService := services.NewNoteService(noteRepository, vodRepository)
	annotationService := services.NewAnnotationService(noteRepository, drawingRepository, vodRepository)

	registerHandler := auth.NewRegisterHandler(authService)
	loginHandler := auth.NewLoginHandler(authService)
	noteHandler := notes.NewNoteHandler(noteService)
	annotationHandler := notes.NewAnnotationHandler(annotationService)

	router.GET("/health", appHealthHandler.Health)
	router.GET("/health/db", dbHealthHandler.Health)

	router.POST("/register", registerHandler.Register)
	router.POST("/login", loginHandler.Login)

	protected := router.Group("/")
	protected.Use(authmiddleware.Middleware())
	protected.GET("/vods/:vodID/notes", noteHandler.GetNotes)
	protected.POST("/vods/:vodID/notes", noteHandler.CreateNote)
	protected.GET("/vods/:vodID/annotations", annotationHandler.GetAnnotations)
	protected.POST("/vods/:vodID/annotations", annotationHandler.CreateAnnotation)

	return router
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
