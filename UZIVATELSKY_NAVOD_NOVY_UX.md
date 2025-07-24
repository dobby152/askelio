# 📖 Uživatelský návod - Nový UX pro nahrávání faktur

## 🎯 Přehled

Nový UX pro nahrávání faktur poskytuje intuitivní a transparentní workflow pro zpracování dokumentů s plnou kontrolou nad extrahovanými daty.

## 🚀 Jak začít

### 1. Přístup k novému UX
- Přejděte na `/documents/new` nebo `/documents/upload`
- Uvidíte moderní upload area s drag & drop funkcionalitou

### 2. Nahrání dokumentu
- **Přetáhněte** soubor do upload area, nebo
- **Klikněte** na upload area a vyberte soubor
- Podporované formáty: PDF, JPG, PNG, GIF, BMP, TIFF (max. 10MB)

## 📋 Workflow kroky

### **Krok 1: Upload & Preview**
- Po nahrání se okamžitě zobrazí PDF náhled vlevo
- Vpravo uvidíte progress indikátor zpracování
- Soubor se automaticky začne zpracovávat

### **Krok 2: OCR Zpracování**
- Systém rozpozná text pomocí OCR technologie
- Vidíte real-time progress s detailními zprávami
- Průměrná doba: 5-15 sekund

### **Krok 3: Extrakce dat**
- AI extrahuje strukturovaná data z dokumentu
- Data se zobrazí jako barevné overlay na PDF
- Každé pole má confidence indikátor (přesnost)

### **Krok 4: ARES Validace**
- Automaticky se ověří IČO dodavatele a odběratele
- Doplní se chybějící údaje z ARES registru
- Označí se neaktivní společnosti nebo chyby

### **Krok 5: Finalizace**
- Můžete editovat jakékoli pole
- Uložit dokument nebo exportovat data
- Připraveno pro import do ERP systému

## 🎨 Ovládání rozhraní

### **PDF Náhled (levá strana)**
- **Zoom**: Tlačítka + a - pro přiblížení/oddálení
- **Rotace**: Tlačítko rotace pro otočení dokumentu
- **Overlay**: Zapnutí/vypnutí zobrazení extrahovaných polí
- **Editace**: Kliknutí na pole pro inline editaci

### **Data Panel (pravá strana)**
Tři taby pro různé pohledy:

#### **📄 Náhled Tab**
- Přehled extrahovaných polí
- Statistiky confidence
- Rychlé ovládání PDF náhledu

#### **✏️ Data Tab**
- Detailní editor všech polí
- Kategorizace: Dodavatel, Odběratel, Faktura, Částky
- Inline editace s validací
- Confidence indikátory

#### **🏢 ARES Tab**
- ARES validace IČO/DIČ
- Automatické doplnění údajů
- Kontrola aktivity společnosti
- Ověření DPH plátcovství

## 🎯 Tipy pro efektivní použití

### **Kontrola kvality dat**
- **Zelená pole** (90%+): Vysoká přesnost, obvykle správné
- **Žlutá pole** (70-89%): Střední přesnost, doporučujeme kontrolu
- **Červená pole** (<70%): Nízká přesnost, nutná manuální kontrola

### **ARES obohacení**
- Pole označená "ARES" byla automaticky doplněna
- Ověřte, že IČO je správně extrahováno pro nejlepší výsledky
- Neaktivní společnosti jsou označeny červeně

### **Editace dat**
- **Klikněte na pole** v PDF nebo v data panelu
- **Enter** pro uložení, **Escape** pro zrušení
- Změny se okamžitě projeví v obou pohledech

### **Keyboard shortcuts**
- **Tab**: Přepínání mezi poli
- **Enter**: Uložení editace
- **Escape**: Zrušení editace
- **Ctrl + S**: Uložení dokumentu

## ⚠️ Řešení problémů

### **PDF se nenačte**
- Zkontrolujte, že soubor není poškozený
- Podporované jsou pouze standardní PDF formáty
- Maximální velikost je 10MB

### **Nízká přesnost OCR**
- Zkuste otočit dokument pomocí rotace
- Použijte vyšší rozlišení při skenování
- Tmavý text na světlém pozadí funguje nejlépe

### **ARES data se nenačtou**
- Zkontrolujte, že IČO má správný formát (8 číslic)
- Některé společnosti nemusí být v ARES registru
- Zkuste manuální ověření na ares.gov.cz

### **Pomalé zpracování**
- Větší soubory trvají déle
- Složité dokumenty vyžadují více času
- Zkontrolujte internetové připojení

## 📊 Metriky kvality

### **Confidence skóre**
- **95%+**: Excelentní, data jsou téměř jistě správná
- **90-94%**: Velmi dobré, minimální riziko chyby
- **80-89%**: Dobré, doporučujeme rychlou kontrolu
- **70-79%**: Střední, kontrola nutná
- **<70%**: Nízké, manuální kontrola povinná

### **ARES validace**
- **✅ Aktivní**: Společnost je aktivní v registru
- **⚠️ Neaktivní**: Společnost byla zrušena nebo pozastavena
- **❌ Nenalezeno**: IČO neexistuje v ARES registru

## 🔄 Export a další kroky

### **Uložení dokumentu**
- Klikněte na "Uložit" pro uložení do databáze
- Dokument bude dostupný v seznamu dokumentů
- Zachovají se všechny editace a validace

### **Export dat**
- Klikněte na "Export" pro stažení dat
- Dostupné formáty: JSON, CSV, XML
- Připraveno pro import do ERP systémů

### **Integrace s ERP**
- Data jsou kompatibilní s Pohoda, Money S3, Helios
- Použijte API endpoint pro automatickou integraci
- Kontaktujte podporu pro nastavení

## 🆘 Podpora

Pokud narazíte na problémy:
- Zkontrolujte tento návod
- Použijte tlačítko "Nápověda" v aplikaci
- Kontaktujte podporu: podpora@askelio.cz
- Dokumentace API: docs.askelio.cz

---

**Tip**: Nový UX je navržen pro maximální efektivitu. Po několika dokumentech si osvojíte workflow a budete zpracovávat faktury mnohem rychleji než dříve! 🚀
