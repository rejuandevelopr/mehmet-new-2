<?php
/**
 * MMM Transport Moving - Booking Form Handler
 * Handles form submissions with validation and email notifications
 */

// Prevent direct access
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: index.html");
    exit;
}

// Configuration
define('ADMIN_EMAIL', 'your_email@example.com'); // Replace with your actual email
define('SITE_NAME', 'MMM Transport Moving');
define('SITE_URL', 'http://www.transportmoving.ca'); // Replace with your actual URL

// Error reporting (disable in production)
ini_set('display_errors', 0);
error_reporting(E_ALL);

/**
 * Sanitize input data
 */
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

/**
 * Validate email address
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Validate phone number
 */
function validatePhone($phone) {
    // Remove all non-numeric characters
    $phone = preg_replace('/[^0-9]/', '', $phone);
    // Check if it's 10 digits
    return strlen($phone) === 10;
}

/**
 * Validate date
 */
function validateDate($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) {
        return false;
    }
    // Check if date is not in the past
    $today = new DateTime();
    $today->setTime(0, 0, 0);
    return $d >= $today;
}

/**
 * Log errors
 */
function logError($message) {
    $logFile = 'booking_errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message\n";
    error_log($logMessage, 3, $logFile);
}

// Initialize errors array
$errors = [];

// Collect and sanitize form data
$name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : '';
$surname = isset($_POST['surname']) ? sanitizeInput($_POST['surname']) : '';
$phone = isset($_POST['phone']) ? sanitizeInput($_POST['phone']) : '';
$email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
$loading = isset($_POST['loading']) ? sanitizeInput($_POST['loading']) : '';
$unloading = isset($_POST['unloading']) ? sanitizeInput($_POST['unloading']) : '';
$date = isset($_POST['date']) ? sanitizeInput($_POST['date']) : '';
$language = isset($_POST['language']) ? sanitizeInput($_POST['language']) : 'en';

// Validate required fields
if (empty($name)) {
    $errors[] = 'First name is required';
}

if (empty($surname)) {
    $errors[] = 'Last name is required';
}

if (empty($phone)) {
    $errors[] = 'Phone number is required';
} elseif (!validatePhone($phone)) {
    $errors[] = 'Invalid phone number format';
}

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!validateEmail($email)) {
    $errors[] = 'Invalid email address';
}

if (empty($loading)) {
    $errors[] = 'Pickup address is required';
}

if (empty($unloading)) {
    $errors[] = 'Drop-off address is required';
}

if (empty($date)) {
    $errors[] = 'Moving date is required';
} elseif (!validateDate($date)) {
    $errors[] = 'Invalid date or date is in the past';
}

// If there are validation errors, redirect back with error
if (!empty($errors)) {
    logError('Validation errors: ' . implode(', ', $errors));
    header("Location: " . ($language === 'fr' ? 'fr.html' : 'index.html') . "?error=validation");
    exit;
}

// Prepare email to admin
$adminSubject = ($language === 'fr') 
    ? "Nouvelle demande de réservation - " . SITE_NAME 
    : "New Booking Request - " . SITE_NAME;

$adminMessage = "
===========================================
BOOKING DETAILS / DÉTAILS DE LA RÉSERVATION
===========================================

Customer Information / Informations client:
-------------------------------------------
Name / Nom: $name $surname
Phone / Téléphone: $phone
Email / Courriel: $email

Moving Details / Détails du déménagement:
-------------------------------------------
Pickup Address / Adresse de départ: $loading
Drop-off Address / Adresse d'arrivée: $unloading
Moving Date / Date: $date

-------------------------------------------
Submission Time / Heure de soumission: " . date('Y-m-d H:i:s') . "
Language / Langue: " . strtoupper($language) . "

-------------------------------------------
Please contact the customer as soon as possible.
Veuillez contacter le client dès que possible.

===========================================
";

$adminHeaders = "From: " . $email . "\r\n";
$adminHeaders .= "Reply-To: " . $email . "\r\n";
$adminHeaders .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$adminHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send email to admin
$adminEmailSent = mail(ADMIN_EMAIL, $adminSubject, $adminMessage, $adminHeaders);

if (!$adminEmailSent) {
    logError('Failed to send admin email for booking: ' . $name . ' ' . $surname);
}

// Prepare confirmation email to customer
if ($language === 'fr') {
    $customerSubject = "Confirmation de réservation - " . SITE_NAME;
    $customerMessage = "
Bonjour $name,

Merci d'avoir choisi " . SITE_NAME . " pour votre déménagement!

Nous avons bien reçu votre demande de réservation avec les détails suivants:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DÉTAILS DE VOTRE RÉSERVATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom: $name $surname
Téléphone: $phone
Email: $email

Adresse de départ: $loading
Adresse d'arrivée: $unloading
Date de déménagement: $date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre équipe vous contactera dans les plus brefs délais pour confirmer 
votre réservation et discuter des détails de votre déménagement.

Si vous avez des questions, n'hésitez pas à nous contacter:
📞 Téléphone: (514) 246-4943
📧 Email: info@transportdemenagement.ca
🌐 Site Web: " . SITE_URL . "

Merci de votre confiance!

Cordialement,
L'équipe " . SITE_NAME . "
";
} else {
    $customerSubject = "Booking Confirmation - " . SITE_NAME;
    $customerMessage = "
Hello $name,

Thank you for choosing " . SITE_NAME . " for your move!

We have received your booking request with the following details:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR BOOKING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: $name $surname
Phone: $phone
Email: $email

Pickup Address: $loading
Drop-off Address: $unloading
Moving Date: $date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Our team will contact you shortly to confirm your booking and discuss 
the details of your move.

If you have any questions, please don't hesitate to contact us:
📞 Phone: (514) 246-4943
📧 Email: info@transportmoving.ca
🌐 Website: " . SITE_URL . "

Thank you for your trust!

Best regards,
The " . SITE_NAME . " Team
";
}

$customerHeaders = "From: " . ADMIN_EMAIL . "\r\n";
$customerHeaders .= "Reply-To: " . ADMIN_EMAIL . "\r\n";
$customerHeaders .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$customerHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send confirmation email to customer
$customerEmailSent = mail($email, $customerSubject, $customerMessage, $customerHeaders);

if (!$customerEmailSent) {
    logError('Failed to send customer confirmation email to: ' . $email);
}

// Redirect back with success message
$redirectPage = ($language === 'fr') ? 'fr.html' : 'index.html';
header("Location: $redirectPage?success=1");
exit;
?>