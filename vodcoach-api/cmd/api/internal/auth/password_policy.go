package auth

import "unicode"

const MinPasswordLength = 7

func ValidatePasswordStrength(password string) bool {
	if len(password) < MinPasswordLength {
		return false
	}

	hasUppercase := false
	hasSymbol := false

	for _, char := range password {
		if unicode.IsUpper(char) {
			hasUppercase = true
			continue
		}

		if unicode.IsPunct(char) || unicode.IsSymbol(char) {
			hasSymbol = true
		}
	}

	return hasUppercase && hasSymbol
}
