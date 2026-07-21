package aws

// NormalizeS3Versioning normalizes S3 bucket versioning configuration from Terraform state
// or AWS GetBucketVersioning API responses into a canonical slice representation:
// []any{map[string]any{"enabled": bool, "mfa_delete": bool}}.
func NormalizeS3Versioning(v any) []any {
	enabled := false
	mfaDelete := false

	if v != nil {
		switch t := v.(type) {
		case bool:
			enabled = t
		case map[string]any:
			enabled = parseBoolOrString(t["enabled"])
			mfaDelete = parseBoolOrString(t["mfa_delete"])
		case []any:
			if len(t) > 0 {
				return NormalizeS3Versioning(t[0])
			}
		case []map[string]any:
			if len(t) > 0 {
				return NormalizeS3Versioning(t[0])
			}
		}
	}

	return []any{
		map[string]any{
			"enabled":    enabled,
			"mfa_delete": mfaDelete,
		},
	}
}

func parseBoolOrString(val any) bool {
	if val == nil {
		return false
	}
	switch t := val.(type) {
	case bool:
		return t
	case string:
		return t == "true" || t == "Enabled" || t == "enabled"
	default:
		return false
	}
}

// NormalizeS3BucketAttributes normalizes all S3 bucket attributes for drift comparison,
// filtering out Terraform-only metadata (such as force_destroy) and standardizing versioning.
func NormalizeS3BucketAttributes(attrs map[string]any) map[string]any {
	if attrs == nil {
		attrs = make(map[string]any)
	}

	normalized := make(map[string]any)
	for k, v := range attrs {
		// Ignore Terraform-only metadata fields that AWS has no equivalent for
		if k == "force_destroy" {
			continue
		}
		if k == "versioning" {
			normalized[k] = NormalizeS3Versioning(v)
		} else {
			normalized[k] = v
		}
	}

	// Guarantee versioning attribute is deterministically present and normalized
	if _, ok := normalized["versioning"]; !ok {
		normalized["versioning"] = NormalizeS3Versioning(nil)
	}

	return normalized
}
