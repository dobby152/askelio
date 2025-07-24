# ARES API Client - Czech Company Registry Integration
# Automatické doplňování údajů subjektů na základě IČO

import requests
import json
import time
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from functools import lru_cache

logger = logging.getLogger(__name__)

@dataclass
class CompanyData:
    """Strukturovaná data o společnosti z ARES"""
    ico: str
    name: str
    dic: Optional[str] = None
    address: Optional[str] = None
    legal_form: Optional[str] = None
    is_active: bool = True
    is_vat_payer: bool = False
    
class AresClient:
    """
    Klient pro komunikaci s ARES API
    Poskytuje automatické doplňování údajů o českých společnostech
    """
    
    BASE_URL = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty"
    TIMEOUT = 10  # seconds
    MAX_RETRIES = 3
    RETRY_DELAY = 1  # seconds
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Askelio-Invoice-Processor/3.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        
        # Simple in-memory cache for session
        self._cache = {}
        
    @lru_cache(maxsize=1000)
    def get_company_data(self, ico: str) -> Optional[CompanyData]:
        """
        Získá údaje o společnosti z ARES na základě IČO
        
        Args:
            ico: IČO společnosti (8 číslic)
            
        Returns:
            CompanyData nebo None pokud společnost nebyla nalezena
        """
        if not self._validate_ico_format(ico):
            logger.warning(f"❌ Invalid IČO format: {ico}")
            return None
            
        # Check cache first
        if ico in self._cache:
            logger.debug(f"📋 Using cached data for IČO: {ico}")
            return self._cache[ico]
            
        try:
            logger.info(f"🔍 Fetching company data from ARES for IČO: {ico}")
            
            for attempt in range(self.MAX_RETRIES):
                try:
                    url = f"{self.BASE_URL}/{ico}"
                    response = self.session.get(url, timeout=self.TIMEOUT)
                    
                    if response.status_code == 200:
                        data = response.json()
                        company_data = self._parse_ares_response(data)
                        
                        # Cache the result
                        self._cache[ico] = company_data
                        
                        logger.info(f"✅ Successfully fetched data for: {company_data.name}")
                        return company_data
                        
                    elif response.status_code == 404:
                        logger.warning(f"⚠️ Company not found in ARES: {ico}")
                        return None
                        
                    else:
                        logger.warning(f"⚠️ ARES API returned status {response.status_code} for IČO: {ico}")
                        
                except requests.exceptions.RequestException as e:
                    logger.warning(f"⚠️ ARES API request failed (attempt {attempt + 1}): {e}")
                    
                    if attempt < self.MAX_RETRIES - 1:
                        time.sleep(self.RETRY_DELAY * (attempt + 1))
                    
            logger.error(f"❌ Failed to fetch data from ARES after {self.MAX_RETRIES} attempts for IČO: {ico}")
            return None
            
        except Exception as e:
            logger.error(f"❌ Unexpected error fetching ARES data for IČO {ico}: {e}")
            return None
    
    def _parse_ares_response(self, data: Dict[str, Any]) -> CompanyData:
        """Parsuje odpověď z ARES API do strukturovaných dat"""
        try:
            ico = data.get("ico", "")
            name = data.get("obchodniJmeno", "")
            dic = data.get("dic", "")
            
            # Adresa - preferujeme textovou adresu
            address = None
            if "sidlo" in data and "textovaAdresa" in data["sidlo"]:
                address = data["sidlo"]["textovaAdresa"]
            elif "adresaDorucovaci" in data:
                # Fallback na doručovací adresu
                addr_parts = []
                for key in ["radekAdresy1", "radekAdresy2", "radekAdresy3"]:
                    if key in data["adresaDorucovaci"] and data["adresaDorucovaci"][key]:
                        addr_parts.append(data["adresaDorucovaci"][key])
                address = ", ".join(addr_parts) if addr_parts else None
            
            # Právní forma
            legal_form = data.get("pravniForma", "")
            
            # Kontrola aktivity - pokud má datum vzniku a nemá datum zániku
            is_active = True
            if "datumZaniku" in data and data["datumZaniku"]:
                is_active = False
                
            # DPH plátce - kontrola stavu DPH registrace
            is_vat_payer = False
            if "seznamRegistraci" in data:
                dph_stav = data["seznamRegistraci"].get("stavZdrojeDph", "")
                is_vat_payer = dph_stav == "AKTIVNI"
            
            return CompanyData(
                ico=ico,
                name=name,
                dic=dic if dic else None,
                address=address,
                legal_form=legal_form,
                is_active=is_active,
                is_vat_payer=is_vat_payer
            )
            
        except Exception as e:
            logger.error(f"❌ Error parsing ARES response: {e}")
            # Return basic data even if parsing fails
            return CompanyData(
                ico=data.get("ico", ""),
                name=data.get("obchodniJmeno", ""),
                dic=data.get("dic", "")
            )
    
    def _validate_ico_format(self, ico: str) -> bool:
        """Validuje formát IČO (8 číslic)"""
        if not ico or not isinstance(ico, str):
            return False
            
        # Remove spaces and leading zeros
        ico_clean = ico.replace(" ", "").lstrip("0")
        
        # Must be 1-8 digits
        if not ico_clean.isdigit() or len(ico_clean) > 8:
            return False
            
        return True
    
    def enrich_subject_data(self, subject_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Obohacuje údaje o subjektu na základě IČO
        
        Args:
            subject_data: Slovník s údaji o subjektu (vendor nebo customer)
            
        Returns:
            Obohacený slovník s doplněnými údaji z ARES
        """
        if not subject_data or not isinstance(subject_data, dict):
            return subject_data
            
        ico = subject_data.get("ico")
        if not ico:
            return subject_data
            
        # Získej data z ARES
        ares_data = self.get_company_data(ico)
        if not ares_data:
            return subject_data
            
        # Vytvoř kopii původních dat
        enriched = subject_data.copy()
        
        # Doplň chybějící údaje z ARES (neprepisuj existující)
        if not enriched.get("name") and ares_data.name:
            enriched["name"] = ares_data.name
            logger.info(f"📝 Doplněn název z ARES: {ares_data.name}")
            
        if not enriched.get("dic") and ares_data.dic:
            enriched["dic"] = ares_data.dic
            logger.info(f"📝 Doplněno DIČ z ARES: {ares_data.dic}")
            
        if not enriched.get("address") and ares_data.address:
            enriched["address"] = ares_data.address
            logger.info(f"📝 Doplněna adresa z ARES: {ares_data.address}")
            
        # Přidej metadata z ARES
        enriched["_ares_enriched"] = True
        enriched["_ares_active"] = ares_data.is_active
        enriched["_ares_vat_payer"] = ares_data.is_vat_payer
        
        return enriched

# Globální instance pro použití v aplikaci
ares_client = AresClient()
