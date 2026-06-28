package main

import (
	"context"
	"log"
	"os"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/server"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	ctx := context.Background()

	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("Database URL is empty from .env file")
	}

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	router := server.NewRouter(pool)

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
