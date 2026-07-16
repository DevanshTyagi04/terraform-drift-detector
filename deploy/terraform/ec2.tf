resource "aws_instance" "drift_detector" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.instance_type
  key_name             = var.key_name
  subnet_id            = data.aws_subnets.default.ids[0]
  iam_instance_profile = aws_iam_instance_profile.drift_detector.name

  vpc_security_group_ids = [
    aws_security_group.drift_detector.id
  ]

  associate_public_ip_address = true

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true

    tags = merge(
      {
        Name = "${var.project_name}-root-volume"
      },
      local.common_tags
    )
  }

  tags = merge(
    {
      Name = "${var.project_name}-server"
    },
    local.common_tags
  )
}
