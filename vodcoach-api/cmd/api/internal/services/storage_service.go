package services

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type StorageService struct {
	bucketName    string
	presignClient *s3.PresignClient
}

func NewStorageService(bucketName string, s3Client *s3.Client) *StorageService {
	return &StorageService{
		bucketName:    bucketName,
		presignClient: s3.NewPresignClient(s3Client),
	}
}

func (s *StorageService) CreatePresignedUploadURL(ctx context.Context, originalStorageKey string, contentType string) (string, error) {
	presignResult, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(originalStorageKey),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(15*time.Minute))

	if err != nil {
		return "", err
	}

	return presignResult.URL, nil
}
