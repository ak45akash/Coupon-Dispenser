<?php
/**
 * Plugin Name: Coupon Dispenser Test
 * Version: 1.0.0
 */

// Write test file immediately
$test_file = __DIR__ . DIRECTORY_SEPARATOR . 'test-plugin-loaded.txt';
file_put_contents($test_file, date('Y-m-d H:i:s') . " - TEST PLUGIN LOADED\n");

