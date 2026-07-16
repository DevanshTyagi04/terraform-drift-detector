package aws

import (
	"reflect"
	"testing"
)

func TestInt32Value(t *testing.T) {
	var val int32 = 42
	if Int32Value(&val) != 42 {
		t.Errorf("expected 42, got %d", Int32Value(&val))
	}
	if Int32Value(nil) != 0 {
		t.Errorf("expected 0, got %d", Int32Value(nil))
	}
}

func TestBoolValue(t *testing.T) {
	val := true
	if !BoolValue(&val) {
		t.Errorf("expected true, got false")
	}
	if BoolValue(nil) {
		t.Errorf("expected false, got true")
	}
}

func TestSortStringSlice(t *testing.T) {
	slice := []string{"banana", "apple", "cherry"}
	sorted := SortStringSlice(slice)
	expected := []string{"apple", "banana", "cherry"}
	if !reflect.DeepEqual(sorted, expected) {
		t.Errorf("expected %v, got %v", expected, sorted)
	}
	if SortStringSlice(nil) != nil {
		t.Errorf("expected nil for nil slice")
	}
}

func TestNormalizeSecurityGroupRules(t *testing.T) {
	rules := []map[string]any{
		{
			"protocol":    "tcp",
			"from_port":   int32(80),
			"to_port":     int32(80),
			"cidr_blocks": []string{"10.0.0.0/16", "0.0.0.0/0"},
		},
		{
			"protocol":    "tcp",
			"from_port":   int32(22),
			"to_port":     int32(22),
			"cidr_blocks": []string{"192.168.1.0/24"},
		},
	}

	normalized := NormalizeSecurityGroupRules(rules)

	// Since port 22 signature (tcp-22-22-...) is alphabetically before port 80 signature (tcp-80-80-...),
	// the rule with port 22 should be first in the sorted array.
	if normalized[0]["from_port"].(int32) != int32(22) {
		t.Errorf("expected port 22 rule to be first, got port %d rule", normalized[0]["from_port"].(int32))
	}
}
