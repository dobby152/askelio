# 

# 

# 

# 

# 

# 

# 

# **Askelio: Technický návrh MVP**

Tento dokument slouží jako komplexní technický podklad pro vývoj minimálního životaschopného produktu (MVP) aplikace Askelio. Cílem je vytvořit robustní, škálovatelný a bezpečný systém pro automatizované vytěžování dat z faktur a účtenek, **s architekturou připravenou na budoucí integrace do ERP systémů.**

### **1\. Návrh architektury systému**

Celý systém je navržen jako moderní webová aplikace s odděleným frontendem a backendem, což umožňuje flexibilitu a škálovatelnost.

#### **Komponenty systému:**

* **Frontend**: **Next.js**  
* **Backend**: **Python (FastAPI)**  
* **Databáze**: **PostgreSQL**  
* **Asynchronní úlohy**: **Celery & Redis**  
* **Storage**: **Supabase Storage (nebo AWS S3)**  
* **Autentizace**: **Supabase Auth (nebo vlastní JWT)**  
* **Billing**: **Stripe**

#### **Komunikační diagram:**

graph TD  
    A\[Uživatel v prohlížeči\] \--\>|1. Nahrání souboru| B(Frontend \- Next.js);  
    B \--\>|2. API volání (s JWT)| C(Backend \- FastAPI);  
    C \--\>|3. Uložení souboru| D\[Storage (Supabase/S3)\];  
    C \--\>|4. Vytvoření záznamu 'processing'| E\[Databáze (PostgreSQL)\];  
    C \--\>|5. Odeslání úlohy| F\[Broker (Redis)\];  
    F \--\> G\[Worker (Celery)\];  
    G \--\>|6. Stažení souboru| D;  
    G \--\>|7. Zpracování| H{OCR Logika};  
    H \--\>|Tesseract| I\[OpenCV \+ Tesseract\];  
    H \--\>|Fallback| J\[AI OCR (Google/Azure)\];  
    I \--\>|Výsledek \+ skóre| H;  
    J \--\>|Výsledek \+ skóre| H;  
    H \--\>|8. Výběr nejlepšího výsledku| G;  
    G \--\>|9. Uložení výsledků a odečtení kreditů| E;  
    E \--\>|Real-time update| B;  
    B \--\>|10. Zobrazení výsledků| A;

    subgraph Platby  
        B \--\>|11. Dobití kreditu| K(Stripe Checkout);  
        K \--\>|12. Platba| L\[Stripe API\];  
        L \--\>|13. Webhook| C;  
        C \--\>|14. Aktualizace kreditu| E;  
    end  
      
    subgraph ERP Integrace  
        M\[ERP Systém (Pohoda, Money)\] \--\>|15. API volání (s API klíčem)| C;  
        C \--\>|16. Export dat v XML/ISDOC| M;  
    end

#### **API Struktura (FastAPI)**

Základní endpointy budou rozšířeny o endpointy pro integrace.

* /auth: Registrace, login, info o uživateli.  
* /documents: Správa dokumentů.  
* /credits: Správa kreditů.  
* /webhooks: Příjem notifikací od Stripe.  
* **(Nové) /integrations\`: Endpoints pro komunikaci s ERP, viz kapitola 8\.**

#### **Bezpečnost**

Kromě JWT pro uživatele bude systém podporovat **API klíče** pro bezpečný přístup externích systémů.

### **2\. Databázový návrh (PostgreSQL)**

K původním tabulkám (users, documents, credit\_transactions) přidáváme tabulku pro správu API klíčů.

#### 

#### 

#### 

#### 

#### 

#### 

#### 

#### 

#### **Tabulka users**

CREATE TABLE users (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    email VARCHAR(255) UNIQUE NOT NULL,  
    hashed\_password TEXT NOT NULL,  
    credit\_balance NUMERIC(10, 2\) NOT NULL DEFAULT 0.00,  
    created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
    updated\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  
);  
CREATE INDEX idx\_users\_email ON users(email);

#### **Tabulka documents**

CREATE TYPE document\_status AS ENUM ('processing', 'completed', 'failed', 'needs\_review', 'exported');

CREATE TABLE documents (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    user\_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  
    file\_name VARCHAR(255) NOT NULL,  
    storage\_path TEXT NOT NULL,  
    status document\_status NOT NULL DEFAULT 'processing',  
    mime\_type VARCHAR(100) NOT NULL,  
    raw\_tesseract\_data JSONB,  
    raw\_ai\_data JSONB,  
    final\_extracted\_data JSONB,  
    confidence\_score NUMERIC(5, 4),  
    processing\_cost NUMERIC(10, 2\) DEFAULT 0.00,  
    error\_message TEXT,  
    created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
    completed\_at TIMESTAMPTZ  
);  
CREATE INDEX idx\_documents\_user\_id ON documents(user\_id);  
CREATE INDEX idx\_documents\_status ON documents(status);

#### 

#### 

#### **Tabulka credit\_transactions**

CREATE TYPE transaction\_type AS ENUM ('top\_up', 'usage', 'refund', 'correction');

CREATE TABLE credit\_transactions (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    user\_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  
    document\_id UUID REFERENCES documents(id),  
    amount NUMERIC(10, 2\) NOT NULL,  
    type transaction\_type NOT NULL,  
    stripe\_charge\_id VARCHAR(255),  
    description TEXT,  
    created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  
);  
CREATE INDEX idx\_transactions\_user\_id ON credit\_transactions(user\_id);

#### **(Nová) Tabulka api\_keys**

Umožní generovat klíče pro externí aplikace (ERP).

CREATE TABLE api\_keys (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    user\_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  
    key\_prefix VARCHAR(8) UNIQUE NOT NULL, \-- Pro snadnou identifikaci  
    hashed\_key TEXT NOT NULL, \-- Ukládáme pouze hash klíče, nikdy klíč samotný  
    description TEXT,  
    is\_active BOOLEAN NOT NULL DEFAULT TRUE,  
    created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
    last\_used\_at TIMESTAMPTZ  
);

\-- Index pro rychlé vyhledání klíče podle prefixu  
CREATE INDEX idx\_api\_keys\_key\_prefix ON api\_keys(key\_prefix);

### 

### 

### **3\. Workflow zpracování dokumentu**

Workflow zůstává stejné, jak bylo popsáno. Integrace nastává až po úspěšném dokončení (status \= 'completed').

### **4\. Kreditní systém**

Beze změny.

### **5\. Vývojové fáze (Roadmapa)**

#### **Sprint 1: Základní jádro (cca 2-3 týdny)**

* **Cíl**: Uživatel se může registrovat, přihlásit, nahrát fakturu a vidět výsledek z Tesseractu.

#### **Sprint 2: AI a kredity (cca 3 týdny)**

* **Cíl**: Systém inteligentně používá AI OCR a odečítá kredity.

#### **Sprint 3: Platby a dokončení MVP (cca 2 týdny)**

* **Cíl**: Uživatel si může dobít kredit. Aplikace je připravena pro první zákazníky.

#### **Po MVP (Budoucí vylepšení):**

* **Priorita č. 1: Integrace s ERP systémy (Pohoda, Money S3, ...)**.  
* Export výsledků do CSV, JSON.  
* Webhooky pro notifikace o dokončení zpracování.  
* Možnost manuální opravy a validace extrahovaných dat uživatelem.  
* Pokročilá analytika a reporting.

### **6\. Pseudokód / Příklady backendu (FastAPI)**

Beze změny v základním workflow.

### 

### 

### 

### 

### 

### 

### 

### 

### 

### **7\. UX Doporučení**

Beze změny.

### **8\. (Nová) Příprava na integraci s ERP systémy**

Architektura musí od začátku počítat s napojením na externí systémy. Toho dosáhneme kombinací exportních formátů a REST API.

#### **Strategie integrace**

1. **Exportní formáty**: Aplikace bude schopna generovat standardizované soubory, které lze naimportovat do většiny účetních systémů. Primární formát bude **ISDOC** (standard pro elektronickou fakturaci v ČR) a specifické **XML formáty** pro systémy jako Pohoda.  
2. **REST API pro partnery**: Pro hlubší integraci poskytneme zabezpečené REST API, které umožní ERP systémům automaticky stahovat zpracované dokumenty.

#### **Datová transformace**

Flexibilní sloupec final\_extracted\_data (JSONB) je klíčový. Pro každou integraci vytvoříme **transformační vrstvu (mapper)**, která převede náš interní JSON formát na specifickou strukturu požadovanou cílovým systémem (např. Pohoda XML).

* **Příklad mapperu (pseudokód)**:  
  def convert\_to\_pohoda\_xml(extracted\_data: dict) \-\> str:  
      \# Logika pro převod JSON na XML strukturu pro Pohoda  
      \# např. extracted\_data\['invoice\_id'\] \-\> \<inv:invoiceHeader\>\<inv:number\>...\</inv:number\>  
      xml\_string \= build\_pohoda\_xml(extracted\_data)  
      return xml\_string

#### 

#### 

#### 

#### 

#### 

#### 

#### 

#### **API pro integrace (/integrations)**

Tyto endpointy budou vyžadovat autentizaci pomocí API klíče v hlavičce (X-API-Key: \<klic\>).

* GET /integrations/documents:  
  * Vrátí seznam zpracovaných dokumentů připravených k exportu.  
  * Parametry pro filtrování: ?exported=false\&from\_date=2023-10-01.  
  * Odpověď bude obsahovat metadata, nikoliv plná data.  
* GET /integrations/documents/{document\_id}/export:  
  * Vygeneruje a vrátí dokument ve specifickém formátu.  
  * Parametr ?format=isdoc nebo ?format=pohoda\_xml.  
  * Po úspěšném stažení může systém označit dokument jako exported, aby se předešlo duplicitnímu importu.

#### **Bezpečnost a správa API klíčů**

* Uživatel si bude moci v nastavení svého účtu vygenerovat jeden nebo více API klíčů.  
* Při generování se uživateli **jednorázově zobrazí celý klíč**. Systém uloží pouze jeho **hash**.  
* Uživatel bude moci klíče kdykoliv deaktivovat (is\_active \= false).  
* Každé použití klíče bude logováno (last\_used\_at).

Tímto přístupem je Askelio od počátku navržen jako otevřená platforma, což je pro B2B segment klíčová konkurenční výhoda.