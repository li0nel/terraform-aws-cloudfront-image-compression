output "cloudfront_url" {
  value = "${module.cloudfront-image-compression.cloudfront_url}"
}

output "bucket" {
  value = "${module.cloudfront-image-compression.bucket}"
}