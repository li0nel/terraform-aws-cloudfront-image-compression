output "cloudfront_url" {
  value = "${aws_cloudfront_distribution.s3_distribution.aliases[0]}"
}

output "bucket" {
  value = "${aws_s3_bucket.images.bucket}"
}