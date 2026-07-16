package aws

import (
	"fmt"
	"sort"
	"strings"
)

// Int32Value returns the dereferenced int32 value of the pointer, or 0 if nil.
func Int32Value(v *int32) int32 {
	if v == nil {
		return 0
	}
	return *v
}

// BoolValue returns the dereferenced bool value of the pointer, or false if nil.
func BoolValue(v *bool) bool {
	if v == nil {
		return false
	}
	return *v
}

// SortStringSlice sorts a slice of strings in-place.
func SortStringSlice(slice []string) []string {
	if slice == nil {
		return nil
	}
	sort.Strings(slice)
	return slice
}

// NormalizeSecurityGroupRules sorts security group rules based on a deterministic signature.
func NormalizeSecurityGroupRules(rules []map[string]any) []map[string]any {
	if rules == nil {
		return nil
	}
	sort.Slice(rules, func(i, j int) bool {
		return ruleSignature(rules[i]) < ruleSignature(rules[j])
	})
	return rules
}

func ruleSignature(rule map[string]any) string {
	protocol := ""
	if p, ok := rule["protocol"].(string); ok {
		protocol = p
	}
	fromPort := int32(0)
	if f, ok := rule["from_port"].(int32); ok {
		fromPort = f
	}
	toPort := int32(0)
	if t, ok := rule["to_port"].(int32); ok {
		toPort = t
	}
	var cidrs []string
	if c, ok := rule["cidr_blocks"].([]string); ok {
		cidrs = make([]string, len(c))
		copy(cidrs, c)
	}
	sort.Strings(cidrs)
	return fmt.Sprintf("%s-%d-%d-%s", protocol, fromPort, toPort, strings.Join(cidrs, ","))
}
