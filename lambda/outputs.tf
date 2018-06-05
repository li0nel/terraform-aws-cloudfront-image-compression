output "origin_response_function_arn" {
  value = "${aws_lambda_function.origin_response.arn}:${aws_lambda_function.origin_response.version}"
}

output "origin_response_function_name" {
  value = "${aws_lambda_function.origin_response.function_name}"
}