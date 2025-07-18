"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, MessageCircle, Book, Mail } from "lucide-react"

export default function HelpPage() {
  const faqs = [
    {
      question: "Jak nahraju dokument k zpracování?",
      answer: "Dokumenty můžete nahrát přetažením do upload oblasti na dashboardu nebo kliknutím na tlačítko 'Vybrat soubory'. Podporujeme formáty PDF, JPG a PNG do velikosti 10MB."
    },
    {
      question: "Kolik kreditů stojí zpracování dokumentu?",
      answer: "Cena závisí na složitosti dokumentu. Jednoduchý dokument stojí 10-25 kreditů, složitější dokumenty mohou stát až 50 kreditů."
    },
    {
      question: "Jak dlouho trvá zpracování dokumentu?",
      answer: "Většina dokumentů je zpracována do 2-5 minut. Složitější dokumenty mohou trvat až 10 minut."
    },
    {
      question: "Mohu exportovat zpracovaná data?",
      answer: "Ano, data můžete exportovat do formátů Excel, CSV nebo JSON pomocí tlačítka Export v tabulce dokumentů."
    },
    {
      question: "Jak si mohu koupit více kreditů?",
      answer: "Kredity si můžete dokoupit v sekci 'Správa kreditů' nebo když vám dojdou kredity, systém vás automaticky upozorní."
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nápověda</h1>
          <p className="text-gray-600 dark:text-gray-400">Najděte odpovědi na vaše otázky</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rychlé odkazy */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Book className="w-5 h-5" />
                  <span>Rychlé odkazy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Začínáme
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Uživatelská příručka
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Kontaktovat podporu
                </Button>
              </CardContent>
            </Card>

            {/* Kontaktní formulář */}
            <Card>
              <CardHeader>
                <CardTitle>Kontaktujte nás</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input placeholder="Váš email" type="email" />
                </div>
                <div className="space-y-2">
                  <Input placeholder="Předmět" />
                </div>
                <div className="space-y-2">
                  <Textarea placeholder="Vaše zpráva..." rows={4} />
                </div>
                <Button className="w-full">Odeslat zprávu</Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Často kladené otázky</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
