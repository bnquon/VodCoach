package events

import (
	"context"
	"encoding/json"

	"github.com/twmb/franz-go/pkg/kgo"
)

type RedpandaPublisher struct {
	client *kgo.Client
}

func NewRedpandaPublisher(brokers []string) (*RedpandaPublisher, error) {
	options, err := NewKafkaClientOptions(brokers)
	if err != nil {
		return nil, err
	}

	client, err := kgo.NewClient(options...)
	if err != nil {
		return nil, err
	}

	return &RedpandaPublisher{
		client: client,
	}, nil
}

func (p *RedpandaPublisher) PublishVodUploaded(ctx context.Context, event VodUploadedEvent) error {
	value, err := json.Marshal(event)
	if err != nil {
		return err
	}

	record := &kgo.Record{
		Topic: VodUploadedTopic,
		Key:   []byte(event.VodID),
		Value: value,
	}

	return p.client.ProduceSync(ctx, record).FirstErr()
}

func (p *RedpandaPublisher) Close() {
	p.client.Close()
}
