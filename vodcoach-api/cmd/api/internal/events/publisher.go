package events

import "context"

type Publisher interface {
	PublishVodUploaded(ctx context.Context, event VodUploadedEvent) error
	Close()
}

type NoopPublisher struct{}

func NewNoopPublisher() *NoopPublisher {
	return &NoopPublisher{}
}

func (p *NoopPublisher) PublishVodUploaded(ctx context.Context, event VodUploadedEvent) error {
	// Phase 4: replace this with a Redpanda/Kafka publisher.
	//
	// The real implementation should:
	// 1. JSON encode VodUploadedEvent.
	// 2. Publish it to VodUploadedTopic.
	// 3. Use event.VodID as the message key so all events for one VOD stay ordered.
	// 4. Return an error if Redpanda did not acknowledge the write.
	return nil
}

func (p *NoopPublisher) Close() {}
