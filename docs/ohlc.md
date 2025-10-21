---
noteId: "52aebce0ae5211f0b49d31b38e97b452"
tags: []

---

# Coin OHLC Chart by ID

> This endpoint allows you to **get the OHLC chart (Open, High, Low, Close) of a coin based on particular coin ID**

## OpenAPI

````yaml v3.0.1/reference/api-reference/coingecko-demo.json get /coins/{id}/ohlc
paths:
  path: /coins/{id}/ohlc
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
      path:
        id:
          schema:
            - type: string
              required: true
              description: |-
                coin ID 
                 *refers to [`/coins/list`](/reference/coins-list).
              default: bitcoin
              example: bitcoin
      query:
        vs_currency:
          schema:
            - type: string
              required: true
              description: |-
                target currency of price data 
                 *refers to [`/simple/supported_vs_currencies`](/reference/simple-supported-currencies).
              default: usd
              example: usd
        days:
          schema:
            - type: enum<string>
              enum:
                - '1'
                - '7'
                - '14'
                - '30'
                - '90'
                - '180'
                - '365'
              required: true
              description: 'data up to number of days ago '
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
          - type: array
            items:
              allOf:
                - type: array
                  items:
                    type: number
            refIdentifier: '#/components/schemas/CoinsOHLC'
            example:
              - - 1709395200000
                - 61942
                - 62211
                - 61721
                - 61845
              - - 1709409600000
                - 61828
                - 62139
                - 61726
                - 62139
              - - 1709424000000
                - 62171
                - 62210
                - 61821
                - 62068
        examples:
          example:
            value:
              - - 1709395200000
                - 61942
                - 62211
                - 61721
                - 61845
              - - 1709409600000
                - 61828
                - 62139
                - 61726
                - 62139
              - - 1709424000000
                - 62171
                - 62210
                - 61821
                - 62068
        description: Get coin's OHLC
  deprecated: false
  type: path
  xMint:
    href: /v3.0.1/reference/coins-id-ohlc
components:
  schemas: {}

````