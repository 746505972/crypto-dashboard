---
noteId: "32bf6240ae5211f0b49d31b38e97b452"
tags: []

---

# Coins List with Market Data

> This endpoint allows you to **query all the supported coins with price, market cap, volume and market related data**

## OpenAPI

````yaml v3.0.1/reference/api-reference/coingecko-demo.json get /coins/markets
paths:
  path: /coins/markets
  method: get
  servers:
    - url: https://api.coingecko.com/api/v3
  request:
    security:
      - title: apiKeyAuth
        parameters:
          query: {}
          header:
            x-cg-demo-api-key:
              type: apiKey
          cookie: {}
      - title: apiKeyQueryParam
        parameters:
          query:
            x_cg_demo_api_key:
              type: apiKey
          header: {}
          cookie: {}
    parameters:
      path: {}
      query:
        vs_currency:
          schema:
            - type: string
              required: true
              description: |-
                target currency of coins and market data 
                 *refers to [`/simple/supported_vs_currencies`](/reference/simple-supported-currencies).
              default: usd
              example: usd
        ids:
          schema:
            - type: string
              required: false
              description: |-
                coins' IDs, comma-separated if querying more than 1 coin. 
                 *refers to [`/coins/list`](/reference/coins-list).
              default: bitcoin
        names:
          schema:
            - type: string
              required: false
              description: coins' names, comma-separated if querying more than 1 coin.
              default: Bitcoin
        symbols:
          schema:
            - type: string
              required: false
              description: coins' symbols, comma-separated if querying more than 1 coin.
              default: btc
        include_tokens:
          schema:
            - type: enum<string>
              enum:
                - top
                - all
              required: false
              description: >-
                for `symbols` lookups, specify `all` to include all matching
                tokens 
                 Default `top` returns top-ranked tokens (by market cap or volume)
        category:
          schema:
            - type: string
              required: false
              description: |-
                filter based on coins' category 
                 *refers to [`/coins/categories/list`](/reference/coins-categories-list).
              default: layer-1
              example: layer-1
        order:
          schema:
            - type: enum<string>
              enum:
                - market_cap_asc
                - market_cap_desc
                - volume_asc
                - volume_desc
                - id_asc
                - id_desc
              required: false
              description: 'sort result by field, default: market_cap_desc'
        per_page:
          schema:
            - type: integer
              required: false
              description: |-
                total results per page, default: 100 
                 Valid values: 1...250
        page:
          schema:
            - type: integer
              required: false
              description: 'page through results, default: 1'
        sparkline:
          schema:
            - type: boolean
              required: false
              description: 'include sparkline 7 days data, default: false'
        price_change_percentage:
          schema:
            - type: string
              required: false
              description: >-
                include price change percentage timeframe, comma-separated if
                query more than 1 timeframe 
                 Valid values: 1h, 24h, 7d, 14d, 30d, 200d, 1y
              default: 1h
        locale:
          schema:
            - type: enum<string>
              enum:
                - ar
                - bg
                - cs
                - da
                - de
                - el
                - en
                - es
                - fi
                - fr
                - he
                - hi
                - hr
                - hu
                - id
                - it
                - ja
                - ko
                - lt
                - nl
                - 'no'
                - pl
                - pt
                - ro
                - ru
                - sk
                - sl
                - sv
                - th
                - tr
                - uk
                - vi
                - zh
                - zh-tw
              required: false
              description: 'language background, default: en'
        precision:
          schema:
            - type: enum<string>
              enum:
                - full
                - '0'
                - '1'
                - '2'
                - '3'
                - '4'
                - '5'
                - '6'
                - '7'
                - '8'
                - '9'
                - '10'
                - '11'
                - '12'
                - '13'
                - '14'
                - '15'
                - '16'
                - '17'
                - '18'
              required: false
              description: decimal place for currency price value
      header: {}
      cookie: {}
    body: {}
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              id:
                allOf:
                  - type: string
                    description: coin ID
              symbol:
                allOf:
                  - type: string
                    description: coin symbol
              name:
                allOf:
                  - type: string
                    description: coin name
              image:
                allOf:
                  - type: string
                    description: coin image url
              current_price:
                allOf:
                  - type: number
                    description: coin current price in currency
              market_cap:
                allOf:
                  - type: number
                    description: coin market cap in currency
              market_cap_rank:
                allOf:
                  - type: number
                    description: coin rank by market cap
              fully_diluted_valuation:
                allOf:
                  - type: number
                    description: coin fully diluted valuation (fdv) in currency
              total_volume:
                allOf:
                  - type: number
                    description: coin total trading volume in currency
              high_24h:
                allOf:
                  - type: number
                    description: coin 24hr price high in currency
              low_24h:
                allOf:
                  - type: number
                    description: coin 24hr price low in currency
              price_change_24h:
                allOf:
                  - type: number
                    description: coin 24hr price change in currency
              price_change_percentage_24h:
                allOf:
                  - type: number
                    description: coin 24hr price change in percentage
              market_cap_change_24h:
                allOf:
                  - type: number
                    description: coin 24hr market cap change in currency
              market_cap_change_percentage_24h:
                allOf:
                  - type: number
                    description: coin 24hr market cap change in percentage
              circulating_supply:
                allOf:
                  - type: number
                    description: coin circulating supply
              total_supply:
                allOf:
                  - type: number
                    description: coin total supply
              max_supply:
                allOf:
                  - type: number
                    description: coin max supply
              ath:
                allOf:
                  - type: number
                    description: coin all time high (ATH) in currency
              ath_change_percentage:
                allOf:
                  - type: number
                    description: coin all time high (ATH) change in percentage
              ath_date:
                allOf:
                  - type: string
                    format: date-time
                    description: coin all time high (ATH) date
              atl:
                allOf:
                  - type: number
                    description: coin all time low (atl) in currency
              atl_change_percentage:
                allOf:
                  - type: number
                    description: coin all time low (atl) change in percentage
              atl_date:
                allOf:
                  - type: string
                    format: date-time
                    description: coin all time low (atl) date
              roi:
                allOf:
                  - type: string
              last_updated:
                allOf:
                  - type: string
                    format: date-time
                    description: coin last updated timestamp
            refIdentifier: '#/components/schemas/CoinsMarkets'
            example:
              - id: bitcoin
                symbol: btc
                name: Bitcoin
                image: >-
                  https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1696501400
                current_price: 70187
                market_cap: 1381651251183
                market_cap_rank: 1
                fully_diluted_valuation: 1474623675796
                total_volume: 20154184933
                high_24h: 70215
                low_24h: 68060
                price_change_24h: 2126.88
                price_change_percentage_24h: 3.12502
                market_cap_change_24h: 44287678051
                market_cap_change_percentage_24h: 3.31157
                circulating_supply: 19675987
                total_supply: 21000000
                max_supply: 21000000
                ath: 73738
                ath_change_percentage: -4.77063
                ath_date: '2024-03-14T07:10:36.635Z'
                atl: 67.81
                atl_change_percentage: 103455.83335
                atl_date: '2013-07-06T00:00:00.000Z'
                roi: null
                last_updated: '2024-04-07T16:49:31.736Z'
        examples:
          example:
            value:
              - id: bitcoin
                symbol: btc
                name: Bitcoin
                image: >-
                  https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1696501400
                current_price: 70187
                market_cap: 1381651251183
                market_cap_rank: 1
                fully_diluted_valuation: 1474623675796
                total_volume: 20154184933
                high_24h: 70215
                low_24h: 68060
                price_change_24h: 2126.88
                price_change_percentage_24h: 3.12502
                market_cap_change_24h: 44287678051
                market_cap_change_percentage_24h: 3.31157
                circulating_supply: 19675987
                total_supply: 21000000
                max_supply: 21000000
                ath: 73738
                ath_change_percentage: -4.77063
                ath_date: '2024-03-14T07:10:36.635Z'
                atl: 67.81
                atl_change_percentage: 103455.83335
                atl_date: '2013-07-06T00:00:00.000Z'
                roi: null
                last_updated: '2024-04-07T16:49:31.736Z'
        description: List all coins with market data
  deprecated: false
  type: path
  xMint:
    href: /v3.0.1/reference/coins-markets
components:
  schemas: {}

````