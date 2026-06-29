package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
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

	var accountId = os.Getenv("R2_ACCOUNT_ID")
	var bucketName = os.Getenv("R2_BUCKET_NAME")
	var accessKeyId = os.Getenv("R2_AK_ID")
	var accessKeySecret = os.Getenv("R2_SAK")

	if accountId == "" || bucketName == "" || accessKeyId == "" || accessKeySecret == "" {
		log.Fatal("One of or more .env vars for R2 bucket connection is empty")
	}

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyId, accessKeySecret, "")),
		config.WithRegion("auto"), // Required by SDK but not used by R2
	)
	if err != nil {
		log.Fatal(err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountId))
	})

	router := server.NewRouter(pool, bucketName, client)

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
