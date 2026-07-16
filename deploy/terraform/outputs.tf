output "instance_id" {
  description = "The unique identifier of the provisioned EC2 instance"
  value       = aws_instance.drift_detector.id
}

output "public_ip" {
  description = "Public IPv4 address assigned to the EC2 server"
  value       = aws_instance.drift_detector.public_ip
}

output "public_dns" {
  description = "Public DNS hostname mapped to the EC2 server"
  value       = aws_instance.drift_detector.public_dns
}

output "security_group_id" {
  description = "ID of the attached security group"
  value       = aws_security_group.drift_detector.id
}

output "iam_role_name" {
  description = "Name of the IAM Role attached to the instance profile"
  value       = aws_iam_role.drift_detector.name
}
