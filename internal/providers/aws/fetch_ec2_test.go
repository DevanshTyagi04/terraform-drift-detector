package aws

import (
	"reflect"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
)

func TestEc2TagMap(t *testing.T) {
	tags := []ec2types.Tag{
		{
			Key:   aws.String("Name"),
			Value: aws.String("my-instance"),
		},
		{
			Key:   aws.String("env"),
			Value: aws.String("prod"),
		},
	}

	result := ec2TagMap(tags)
	expected := map[string]string{
		"Name": "my-instance",
		"env":  "prod",
	}

	if !reflect.DeepEqual(result, expected) {
		t.Errorf("expected %v, got %v", expected, result)
	}
}

func TestNormalizeRules(t *testing.T) {
	perms := []ec2types.IpPermission{
		{
			IpProtocol: aws.String("tcp"),
			FromPort:   aws.Int32(80),
			ToPort:     aws.Int32(80),
			IpRanges: []ec2types.IpRange{
				{CidrIp: aws.String("0.0.0.0/0")},
			},
		},
	}

	rules := normalizeRules(perms)
	if len(rules) != 1 {
		t.Fatalf("expected 1 rule, got %d", len(rules))
	}

	rule := rules[0]
	if rule["protocol"] != "tcp" {
		t.Errorf("expected protocol tcp, got %v", rule["protocol"])
	}
	if rule["from_port"] != int32(80) {
		t.Errorf("expected from_port 80, got %v", rule["from_port"])
	}
	if rule["to_port"] != int32(80) {
		t.Errorf("expected to_port 80, got %v", rule["to_port"])
	}
	cidrs := rule["cidr_blocks"].([]string)
	if len(cidrs) != 1 || cidrs[0] != "0.0.0.0/0" {
		t.Errorf("expected cidr_blocks [0.0.0.0/0], got %v", cidrs)
	}
}
