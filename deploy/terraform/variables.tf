variable "aws_region" {
  description = "The target AWS region to provision resources in"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance family type (Free Tier eligible defaults)"
  type        = string
  default     = "t2.micro"
}

variable "root_volume_size" {
  description = "Root disk volume size in GB"
  type        = number
  default     = 20
}

variable "key_name" {
  description = "AWS EC2 Key Pair name for SSH shell access"
  type        = string
}

variable "project_name" {
  description = "Name prefix applied to resources"
  type        = string
  default     = "drift-detector"
}

variable "environment" {
  description = "Deployment lifecycle stage (e.g. production, staging)"
  type        = string
  default     = "production"
}

variable "tags" {
  description = "Additional key-value metadata tags applied to resources"
  type        = map(string)
  default     = {}
}
