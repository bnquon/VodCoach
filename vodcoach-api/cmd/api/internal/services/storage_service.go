package services

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type StorageService struct {
	s3Client *s3.Client
}

func NewStorageService(s3Client *s3.Client) *StorageService {
	return &StorageService{
		s3Client,
	}
}

func (s *StorageService) CreatePresignedUploadURL(ctx context.Context, originalStorageKey string, contentType string) (string, error) {
	presignClient := s3.NewPresignClient(s.s3Client)

  presignResult, err := presignClient.PresignPutObject(context.TODO(), &s3.PutObjectInput{
    Bucket: aws.String("vodcoach-vods"),
    Key:    aws.String(originalStorageKey),
		ContentType: aws.String(contentType),
  })

  if err != nil {
    return "", err
  }
	
	return presignResult.URL, nil
}
