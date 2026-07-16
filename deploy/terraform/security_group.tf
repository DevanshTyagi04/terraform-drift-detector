resource "aws_security_group" "drift_detector" {
  name        = "${var.project_name}-sg"
  description = "Drift Detector Security Group - SSH (22), HTTP (80), HTTPS (443)"
  vpc_id      = data.aws_vpc.default.id

  # Inbound SSH rule
  ingress {
    description      = "SSH Access"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  # Inbound HTTP rule
  ingress {
    description      = "HTTP Web Portal"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  # Inbound HTTPS rule
  ingress {
    description      = "HTTPS Secured Web Portal"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  # Outbound rule allowing all egress traffic
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(
    {
      Name = "${var.project_name}-sg"
    },
    local.common_tags
  )
}
