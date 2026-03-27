// Razorpay integration is disabled in the interview branch.
// This file contains no-op exports so import safety is maintained.

export function getRazorpayInstance() {
  throw new Error('Razorpay integration is disabled. Remove razorpay usage from your code.');
}

export async function createRazorpayPlan() {
  throw new Error('Razorpay integration is disabled. Remove razorpay usage from your code.');
}

export async function createRazorpaySubscription() {
  throw new Error('Razorpay integration is disabled. Remove razorpay usage from your code.');
}

export function verifyWebhookSignature() {
  return false;
}

export async function initializeRazorpay() {
  throw new Error('Razorpay integration is disabled. Remove razorpay usage from your code.');
}

export async function createRazorpayOrder() {
  throw new Error('Razorpay integration is disabled. Remove razorpay usage from your code.');
}

export async function cancelRazorpaySubscription() {
  throw new Error('Razorpay integration is disabled. Remove razorpay usage from your code.');
}
