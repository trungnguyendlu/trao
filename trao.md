## Danh sách bảng
## Lược đồ quan hệ giữa các bảng

### 1. Collections

| Column Name       | Data Type      |
|-------------------|----------------|
| Id                | int            |
| Name              | string         |
| IconUrl           | string         |
| CreatedDate       | DateTime       |

### 2. Ads

| Column Name       | Data Type      | Note |
|-------------------|----------------|----------------|
| Id                | int            |
| CollectionId      | int            | FK với bảng Collections |
| Name              | string         |
| Type              | string         | Bán, Cho Tặng, Trao Đổi, ... |
| ShortDescription   | string         |
| Description       | string         |
| ImageUrl         | string         |
| SellerId         | int            | FK với bảng Users |
| LocationDistance  | number         |
| Status            | string         | Active, Draft, Expired, ... |
| CreatedDate       | DateTime       |

### 3. UserActivities

| Column Name       | Data Type      | Note |
|-------------------|----------------|----------------|
| Id                | int            |
| AdsId             | int            | FK với bảng Ads |
| UserId            | int            | FK với bảng Users |
| ActionType        | string         | Thích ads, ... |
| CreatedDate       | DateTime       |

### 4. Offers

| Column Name       | Data Type      | Note |
|-------------------|----------------|----------------|
| Id                | int            |
| AdsId             | int            | FK với bảng Ads |
| OwnerId           | int            | FK với bảng Users |
| Status            | string         | New, Accepted, Rejected, Cancelled, ... |
| CreatedDate       | DateTime       |

### 5. Users

| Column Name       | Data Type      | Note |
|-------------------|----------------|----------------|
| Id                | int            |
| Name              | string         |
| Type              | string         | Seller, Buyer |
| CreatedDate       | DateTime       |

### Lược đồ quan hệ

- **Collections** (1) <--- (N) **Ads**
- **Users** (1) <--- (N) **Ads**
- **Users** (1) <--- (N) **UserActivities**
- **Ads** (1) <--- (N) **UserActivities**
- **Ads** (1) <--- (N) **Offers**
- **Users** (1) <--- (N) **Offers**



## Danh sách API

### 1. Lấy danh sách collection
- **Endpoint:** `/api/v1/collection`
- **Method:** `GET`
- **Response:** Mảng dữ liệu chứa các trường:
    ```json
    {
        "Success": true,
        "Data": [
            {
                "Id": "string",
                "Name": "string",
                "IconUrl": "string",
                "TotalNumberAds": "number"
            }
        ]
    }
    ```

### 2. Lấy thông tin chi tiết của quảng cáo đầu tiên trong collection
- **Endpoint:** `/api/v1/ads/first?collectionId=123`
- **Method:** `GET`
- **Request:** 
    - `collectionId`
- **Response:** Thông tin của quảng cáo đầu tiên:
    ```json
    {
        "Success": true,
        "Data": {
            "Id": "string",
            "Name": "string",
            "ShortDescription": "string",
            "Description": "string",
            "ImageUrl": "string",
            "SellerName": "string",
            "LocationDistance": "number",
            "TotalOffer": "number",
            "Offers": [
                {
                    "Id": "string",
                    "AdsName": "string",
                    "OwnerName": "string",
                    "CreatedDate": "string",
                    "Status": "string"
                }
            ]
        }
    }
    ```

### 3. Lấy thông tin chi tiết của Ads tiếp theo trong collection
- **Endpoint:** `/api/v1/ads/next?collectionId=123&currentIndex=0`
- **Method:** `GET`
- **Request:** 
    - `collectionId`
    - `currentIndex`
- **Response:** Thông tin của ads:
    ```json
    {
        "Success": true,
        "Data": {
            "Id": "string",
            "Name": "string",
            "ShortDescription": "string",
            "Description": "string",
            "ImageUrl": "string",
            "SellerName": "string",
            "LocationDistance": "number",
            "TotalOffer": "number",
            "Offers": [
                {
                    "Id": "string",
                    "AdsId": "int",
                    "AdsName": "string",
                    "OwerId": "int",
                    "OwnerName": "string",
                    "CreatedDate": "string",
                    "Status": "string"
                }
            ]
        }
    }
    ```

### 4. API lưu quảng cáo khi nhấn nút thích
- **Endpoint:** `/api/v1/ads/heart`
- **Method:** `POST`
- **Request:**
    - `UserId`
    - `AdsId`
- **Response:**
    ```json
    {
        "Success": true,
        "Data": {}
    }
    ```

### 5. API cho seller cập nhật status của offer
- **Endpoint**: `/api/v1/offer/status-update`
- **Method**: `PUT`
- **Request**:
    ```json
    {
        "AdsId": "string",
        "UserId": "int",
        "ActionType": "string"
    }
    ```
- **Response:**
    ```json
    {
        "Success": true,
        "Data": {}
    }
    ```

### 6. API tạo Ads (có thời gian thì làm)
- **Endpoint**: `/api/v1/ads`
- **Method**: `POST`
- **Request**:
    ```json
    {
        "Name": "string",
        "ShortDescription": "string",
        "Description": "string",
        "ImageUrl": "string",
        "SellerName": "string",
        "LocationDistance": "number",
        "TotalOffer": "number"
    }
    ```
- **Response**:
    ```json
    {
        "Success": true,
        "Data": 
        {
            "Id": "string",
            "Name": "string",
            "ShortDescription": "string",
            "Description": "string",
            "ImageUrl": "string",
            "SellerName": "string",
            "LocationDistance": "number",
            "TotalOffer": "number"
        }
    }
    ``` 

### 6. API lấy danh sách ads theo user
- **Page**: Choose ads to swap
- **Description**: Chỉ lấy danh sách ads active
- **Endpoint**: `/api/v1/ads?userId=123`
- **Method**: `GET`
- **Request**:
    - `userId`
- **Response**:
    ```json
    {
        "Success": true,
        "Data": [
            {
                "Id": "string",
                "Name": "string",
                "ShortDescription": "string",
                "Description": "string",
                "ImageUrl": "string",
                "SellerName": "string",
                "LocationDistance": "number",
                "TotalOffer": "number"
            }
        ]
    }
    ``` 

### 7. API tạo offer
- **Page**: Choose ads to swap
- **Endpoint**: `/api/v1/offer`
- **Method**: `POST`
- **Request**:
    ```json
    {
        "AdsId": "int",
        "OwnerId": "int",
        "CreatedDate": "DateTime",
        "Status": "string"
    }
    ```
- **Response**:
    ```json
    {
        "Success": true,
        "Data": 
        {
            "Id": "int",
            "AdsId": "int",
            "OwnerId": "int",
            "CreatedDate": "DateTime",
            "Status": "string"
        }
    }
    ``` 