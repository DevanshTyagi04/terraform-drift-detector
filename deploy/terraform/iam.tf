# Create the IAM Role for the Drift Detector EC2 instance
resource "aws_iam_role" "drift_detector" {
  name = "TerraformDriftDetectorRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Create the IAM Instance Profile attached to the role
resource "aws_iam_instance_profile" "drift_detector" {
  name = "${var.project_name}-instance-profile"
  role = aws_iam_role.drift_detector.name

  tags = local.common_tags
}

# Attach read-only AWS drift scanning permissions policy
resource "aws_iam_role_policy" "drift_detector" {
  name = "${var.project_name}-scan-policy"
  role = aws_iam_role.drift_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Read-only EC2 permissions to audit VPC/EC2 configurations
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
          "ec2:DescribeVolumes",
          "ec2:DescribeNetworkInterfaces"
        ]
        Resource = "*"
      },
      # Read-only S3 permissions to load/list expected states
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:ListAllMyBuckets"
        ]
        Resource = "*"
      }
    ]
  })
}
