package server

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	authmiddleware "github.com/bnquon/vodcoach-api/cmd/api/internal/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/events"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/debug"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/health"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/notes"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/shares"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/handlers/vods"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(pool *pgxpool.Pool, r2BucketName string, r2ThumbnailBucketName string, s3Client *s3.Client, eventPublisher events.Publisher) *gin.Engine {
	router := gin.Default()
	router.Use(corsMiddleware())

	appHealthHandler := health.NewAppHealthHandler()
	dbHealthHandler := health.NewDBHealthHandler(pool)

	userRepository := repository.NewUserRepository(pool)
	noteRepository := repository.NewNoteRepository(pool)
	drawingRepository := repository.NewDrawingRepository(pool)
	vodRepository := repository.NewVodRepository(pool)
	vodShareRepository := repository.NewVodShareRepository(pool)

	authService := services.NewAuthService(userRepository)
	storageService := services.NewStorageService(r2BucketName, s3Client)
	thumbnailStorageService := services.NewStorageService(r2ThumbnailBucketName, s3Client)
	vodService := services.NewVodService(vodRepository, storageService, thumbnailStorageService, eventPublisher)
	noteService := services.NewNoteService(noteRepository, vodRepository)
	annotationService := services.NewAnnotationService(noteRepository, drawingRepository, vodRepository)
	shareService := services.NewShareService(vodRepository, vodShareRepository, noteRepository, drawingRepository, storageService)

	registerHandler := auth.NewRegisterHandler(authService)
	loginHandler := auth.NewLoginHandler(authService)
	ffprobeHandler := debug.NewFFprobeHandler()
	vodHandler := vods.NewVodHandler(vodService)
	noteHandler := notes.NewNoteHandler(noteService)
	annotationHandler := notes.NewAnnotationHandler(annotationService)
	shareHandler := shares.NewShareHandler(shareService)

	router.GET("/health", appHealthHandler.Health)
	router.GET("/health/db", dbHealthHandler.Health)

	router.POST("/register", registerHandler.Register)
	router.POST("/login", loginHandler.Login)
	router.POST("/shares/:shareToken/session", shareHandler.CreateShareSession)

	protected := router.Group("/")
	protected.Use(authmiddleware.Middleware())
	protected.GET("/vods", vodHandler.GetVods)
	protected.GET("/vods/:vodID", vodHandler.GetVod)
	protected.PATCH("/vods/:vodID", vodHandler.UpdateVod)
	protected.GET("/vods/:vodID/playback-url", vodHandler.CreateVodPlaybackURL)
	protected.POST("/vods/upload", vodHandler.CreateUpload)
	protected.POST("/vods/:vodID/upload-complete", vodHandler.CompleteUpload)
	protected.DELETE("/vods/:vodID", vodHandler.DeleteVod)
	protected.POST("/vods/:vodID/shares", shareHandler.CreateShare)
	protected.GET("/vods/:vodID/shares", shareHandler.GetShares)
	protected.DELETE("/vods/:vodID/shares/:shareID", shareHandler.RevokeShare)
	protected.GET("/vods/:vodID/notes", noteHandler.GetNotes)
	protected.POST("/vods/:vodID/notes", noteHandler.CreateNote)
	protected.PATCH("/vods/:vodID/notes/:noteID", noteHandler.UpdateNote)
	protected.DELETE("/vods/:vodID/notes/:noteID", noteHandler.DeleteNote)
	protected.GET("/vods/:vodID/annotations", annotationHandler.GetAnnotations)
	protected.POST("/vods/:vodID/annotations", annotationHandler.CreateAnnotation)
	protected.POST("/vods/:vodID/annotations/batch", annotationHandler.CreateAnnotationsBatch)
	protected.POST("/debug/ffprobe", ffprobeHandler.Probe)

	shared := router.Group("/shares")
	shared.Use(authmiddleware.ShareMiddleware())
	shared.GET("/vod", shareHandler.GetSharedVod)
	shared.GET("/playback-url", shareHandler.GetSharedPlaybackURL)
	shared.GET("/notes", shareHandler.GetSharedNotes)
	shared.GET("/annotations", shareHandler.GetSharedAnnotations)
	shared.POST("/notes", shareHandler.CreateSharedNote)
	shared.POST("/annotations/batch", shareHandler.CreateSharedAnnotationsBatch)

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
