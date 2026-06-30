package services

import (
	"context"
	"io"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type StorageService struct {
	bucketName    string
	presignClient *s3.PresignClient
	s3Client      *s3.Client
}

func NewStorageService(bucketName string, s3Client *s3.Client) *StorageService {
	return &StorageService{
		bucketName:    bucketName,
		presignClient: s3.NewPresignClient(s3Client),
		s3Client:      s3Client,
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

func (s *StorageService) DownloadObject(ctx context.Context, storageKey string, localPath string) error {
	output, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(storageKey),
	})
	if err != nil {
		return err
	}
	defer output.Body.Close()

	localFile, err := os.Create(localPath)
	if err != nil {
		return err
	}
	defer localFile.Close()

	if _, err := io.Copy(localFile, output.Body); err != nil {
		return err
	}

	return nil
}

func (s *StorageService) UploadObject(ctx context.Context, storageKey string, localPath string, contentType string) error {
	localFile, err := os.Open(localPath)
	if err != nil {
		return err
	}
	defer localFile.Close()

	_, err = s.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(storageKey),
		Body:        localFile,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return err
	}

	return nil
}
