provider "aws" {
  region  = "${var.aws_region}"
  profile = "${var.aws_profile}"
  version = "~> 1.9"
}

provider "aws" {
  region  = "us-east-1"
  profile = "${var.aws_profile}"
  alias   = "us-east-1"
  version = "~> 1.9"
}

module "cloudfront-image-compression" {
  source  = "li0nel/cloudfront-image-compression/aws"
  version = "0.0.3"

  aws_profile = "${var.aws_profile}"
  aws_region = "${var.aws_region}"
  stack_name = "${var.stack_name}"
  domain = "${var.domain}"
  subdomain = "${var.subdomain}"
}