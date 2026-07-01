package events

import (
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/twmb/franz-go/pkg/kgo"
)

const (
	kafkaTLSEnabledKey = "KAFKA_TLS_ENABLED"
	kafkaCACertKey     = "KAFKA_CA_CERT"
	kafkaClientCertKey = "KAFKA_CLIENT_CERT"
	kafkaClientKeyKey  = "KAFKA_CLIENT_KEY"
)

var ErrMissingKafkaBrokers = errors.New("missing kafka brokers")

func ParseBrokerList(rawBrokers string) []string {
	brokerParts := strings.Split(rawBrokers, ",")
	brokers := make([]string, 0, len(brokerParts))

	for _, broker := range brokerParts {
		trimmedBroker := strings.TrimSpace(broker)
		if trimmedBroker != "" {
			brokers = append(brokers, trimmedBroker)
		}
	}

	return brokers
}

func NewKafkaClientOptions(brokers []string, extraOptions ...kgo.Opt) ([]kgo.Opt, error) {
	if len(brokers) == 0 {
		return nil, ErrMissingKafkaBrokers
	}

	options := []kgo.Opt{kgo.SeedBrokers(brokers...)}

	if isKafkaTLSEnabled() {
		tlsConfig, err := newKafkaTLSConfig()
		if err != nil {
			return nil, err
		}

		options = append(options, kgo.DialTLSConfig(tlsConfig))
	}

	options = append(options, extraOptions...)

	return options, nil
}

func isKafkaTLSEnabled() bool {
	value := strings.ToLower(strings.TrimSpace(os.Getenv(kafkaTLSEnabledKey)))

	return value == "true" || value == "1" || value == "yes"
}

func newKafkaTLSConfig() (*tls.Config, error) {
	caCertPEM := loadKafkaPEM(kafkaCACertKey)
	clientCertPEM := loadKafkaPEM(kafkaClientCertKey)
	clientKeyPEM := loadKafkaPEM(kafkaClientKeyKey)

	if len(caCertPEM) == 0 || len(clientCertPEM) == 0 || len(clientKeyPEM) == 0 {
		return nil, errors.New("KAFKA_CA_CERT, KAFKA_CLIENT_CERT, and KAFKA_CLIENT_KEY are required when kafka tls is enabled")
	}

	certPool := x509.NewCertPool()
	if ok := certPool.AppendCertsFromPEM(caCertPEM); !ok {
		return nil, errors.New("failed to parse kafka ca certificate")
	}

	clientCert, err := tls.X509KeyPair(clientCertPEM, clientKeyPEM)
	if err != nil {
		return nil, fmt.Errorf("failed to parse kafka client certificate/key: %w", err)
	}

	return &tls.Config{
		MinVersion:   tls.VersionTLS12,
		RootCAs:      certPool,
		Certificates: []tls.Certificate{clientCert},
	}, nil
}

func loadKafkaPEM(envKey string) []byte {
	value := strings.TrimSpace(os.Getenv(envKey))
	return []byte(strings.ReplaceAll(value, `\n`, "\n"))
}
