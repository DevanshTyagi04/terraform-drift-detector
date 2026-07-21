package aws

import (
	"reflect"
	"testing"
)

func TestNormalizeS3Versioning_Disabled(t *testing.T) {
	expected := []any{
		map[string]any{
			"enabled":    false,
			"mfa_delete": false,
		},
	}

	testCases := []struct {
		name  string
		input any
	}{
		{"nil input", nil},
		{"empty slice", []any{}},
		{"explicit disabled map in slice", []any{map[string]any{"enabled": false, "mfa_delete": false}}},
		{"explicit disabled map", map[string]any{"enabled": false, "mfa_delete": false}},
		{"boolean false", false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := NormalizeS3Versioning(tc.input)
			if !reflect.DeepEqual(got, expected) {
				t.Errorf("NormalizeS3Versioning(%v) = %v, expected %v", tc.input, got, expected)
			}
		})
	}
}

func TestNormalizeS3Versioning_Enabled(t *testing.T) {
	expected := []any{
		map[string]any{
			"enabled":    true,
			"mfa_delete": false,
		},
	}

	testCases := []struct {
		name  string
		input any
	}{
		{"explicit enabled map in slice", []any{map[string]any{"enabled": true, "mfa_delete": false}}},
		{"explicit enabled map", map[string]any{"enabled": true, "mfa_delete": false}},
		{"string Enabled status map", map[string]any{"enabled": "Enabled", "mfa_delete": "Disabled"}},
		{"boolean true", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got := NormalizeS3Versioning(tc.input)
			if !reflect.DeepEqual(got, expected) {
				t.Errorf("NormalizeS3Versioning(%v) = %v, expected %v", tc.input, got, expected)
			}
		})
	}
}

func TestNormalizeS3BucketAttributes_ForceDestroyIgnored(t *testing.T) {
	attrs := map[string]any{
		"force_destroy": true,
		"acl":           "private",
	}

	normalized := NormalizeS3BucketAttributes(attrs)

	if _, ok := normalized["force_destroy"]; ok {
		t.Errorf("expected force_destroy to be stripped from normalized attributes")
	}

	if normalized["acl"] != "private" {
		t.Errorf("expected acl to be preserved, got %v", normalized["acl"])
	}

	if _, ok := normalized["versioning"]; !ok {
		t.Errorf("expected versioning attribute to be auto-populated if missing")
	}
}

func TestNormalizeS3BucketAttributes_ZeroDriftForNewlyCreated(t *testing.T) {
	// Raw attributes from Terraform state for a freshly created bucket
	stateAttrs := map[string]any{
		"force_destroy": false,
		"versioning": []any{
			map[string]any{
				"enabled":    false,
				"mfa_delete": false,
			},
		},
	}

	// Raw attributes from AWS API response (versioning disabled, GetBucketVersioning status "")
	cloudAttrs := map[string]any{
		"acl": nil,
	}

	normState := NormalizeS3BucketAttributes(stateAttrs)
	normCloud := NormalizeS3BucketAttributes(cloudAttrs)

	// Compare normalized versioning
	if !reflect.DeepEqual(normState["versioning"], normCloud["versioning"]) {
		t.Errorf("expected normalized versioning to be equal, got state: %v, cloud: %v", normState["versioning"], normCloud["versioning"])
	}

	// Compare force_destroy exclusion
	if _, ok := normState["force_destroy"]; ok {
		t.Errorf("force_destroy should be excluded from state attributes")
	}
	if _, ok := normCloud["force_destroy"]; ok {
		t.Errorf("force_destroy should be excluded from cloud attributes")
	}
}
