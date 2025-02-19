"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function CryptoTabs() {
  const [text, setText] = useState("");
  const [key, setKey] = useState("");
  const [decryptKey, setDecryptKey] = useState("");
  const [encryptedText, setEncryptedText] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [aesIv] = useState(crypto.getRandomValues(new Uint8Array(12)));

  function xorEncrypt(text, key) {
    if (!key) return text;
    return text
      .split("")
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join("");
  }

  async function getAesKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("custom-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptData() {
    if (!key) return alert("Please enter a key!");
    const aesKey = await getAesKey(key);

    const xorEncrypted = xorEncrypt(text, key);
    const encodedXor = new TextEncoder().encode(xorEncrypted);

    const aesEncrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: aesIv },
      aesKey,
      encodedXor
    );

    setEncryptedText(btoa(String.fromCharCode(...new Uint8Array(aesEncrypted))));
  }

  async function decryptData() {
    if (!decryptKey) {
      alert("Please enter a decryption key!");
      return;
    }
    if (!encryptedText.trim()) {
      alert("Please enter text to decrypt!");
      return;
    }

    try {
      const aesKey = await getAesKey(decryptKey);
      const decodedData = atob(encryptedText).split("").map((char) => char.charCodeAt(0));
      
      const aesDecrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: aesIv },
        aesKey,
        new Uint8Array(decodedData)
      );

      const decryptedResult = xorEncrypt(new TextDecoder().decode(aesDecrypted), decryptKey);
      setDecryptedText(decryptedResult);
    } catch (error) {
      alert("Decryption failed.");
      setDecryptedText("");
    }
  }

  return (
    <Tabs defaultValue="encrypt" className="w-[400px] mx-auto">
      <TabsList className="grid w-full grid-cols-2 bg-zinc-900 text-white">
        <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
        <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
      </TabsList>

      <TabsContent value="encrypt">
        <Card>
          <CardHeader>
            <CardTitle>Encrypt</CardTitle>
            <CardDescription>Enter text and a key.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Text</Label>
            <Input
              type="text"
              placeholder="Enter text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Label>Key</Label>
            <Input
              type="password"
              placeholder="Enter key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <Label className="mt-3">Encrypted Output:</Label>
            <Textarea readOnly value={encryptedText} />
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button onClick={encryptData}>Encrypt</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="decrypt">
        <Card>
          <CardHeader>
            <CardTitle>Decrypt</CardTitle>
            <CardDescription>Enter encrypted text and key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Encrypted Text</Label>
            <Textarea
              placeholder="Enter encrypted text"
              value={encryptedText}
              onChange={(e) => setEncryptedText(e.target.value)}
            />
            <Label>Key</Label>
            <Input
              type="text"
              placeholder="Enter decryption key"
              value={decryptKey}
              onChange={(e) => setDecryptKey(e.target.value)}
            />
            <Label className="mt-3">Decrypted Output:</Label>
            <Textarea readOnly value={decryptedText} />
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button onClick={decryptData}>Decrypt</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
