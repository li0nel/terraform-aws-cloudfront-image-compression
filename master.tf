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

//resource "aws_s3_bucket" "pixel_logs" {
//  bucket_prefix = "${var.stack_name}-pixel-logs-"
//  acl           = "private"
//
//  tags {
//    "app_name" = "${var.stack_name}"
//  }
//}

data "aws_acm_certificate" "certificate" {
  domain      = "${var.subdomain}.${var.domain}"
  types       = ["AMAZON_ISSUED"]
  most_recent = true
  provider    = "aws.us-east-1"
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = "${aws_s3_bucket.images.website_endpoint}"
    origin_id   = "s3_origin"

    custom_origin_config {
      origin_protocol_policy = "http-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1", "SSLv3"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

//  logging_config {
//    include_cookies = true
//    bucket          = "${aws_s3_bucket.pixel_logs.bucket_domain_name}"
//  }

  aliases = ["${var.subdomain}.${var.domain}"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3_origin"

    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 900
    max_ttl                = 86400

    lambda_function_association {
      event_type = "origin-response"
      lambda_arn = "${module.lambda.origin_response_function_arn}"
    }
  }

  custom_error_response {
    error_code            = "502"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = "${data.aws_acm_certificate.certificate.arn}"
    ssl_support_method  = "sni-only"
  }
}

data "aws_route53_zone" "cdn" {
  name = "${var.domain}."
}

resource "aws_route53_record" "cdn_alias" {
  zone_id = "${data.aws_route53_zone.cdn.zone_id}"
  name    = "${aws_cloudfront_distribution.s3_distribution.aliases[0]}"
  type    = "A"

  alias {
    name                   = "${aws_cloudfront_distribution.s3_distribution.domain_name}"
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = true
  }
}

resource "aws_s3_bucket" "images" {
  bucket_prefix = "${var.stack_name}-images-"
  acl           = "public-read"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }
}

module "lambda" {
  source = "./lambda"
  stack_name = "${var.stack_name}"
  aws_profile = "${var.aws_profile}"
}