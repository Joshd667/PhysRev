# COLLEGE_SETUP

## Introduction
This document provides a comprehensive guide to setting up the Physics Audit Tool with an IIS web server, Azure AD authentication, and an SQL Server database, based on the architecture decisions made by the IT department.

## Table of Contents
1. [Overview of Components](#overview-of-components)
2. [IIS Web Server Setup](#iis-web-server-setup)
3. [Azure AD Authentication](#azure-ad-authentication)
4. [SQL Server Database Configuration](#sql-server-database-configuration)
5. [Authentication Flow](#authentication-flow)
6. [Database Architecture](#database-architecture)
7. [Security Considerations](#security-considerations)
8. [Requirements](#requirements)
9. [Information Required by IT](#information-required-by-it)

## Overview of Components
The Physics Audit Tool is designed to operate seamlessly within the defined architecture, requiring an IIS web server for hosting, Azure AD for secure authentication, and SQL Server for data management. Each of these components plays a critical role in maintaining the tool’s integrity and performance.

## IIS Web Server Setup
### Step 1: Install IIS
1. Open the Control Panel on your Windows Server.
2. Click on "Programs" > "Turn Windows features on or off".
3. Select "Internet Information Services" and click "OK".

### Step 2: Configure IIS for the Application
1. Open IIS Manager from the Start menu.
2. Right-click on "Sites" and select "Add Website".
3. Provide a site name, physical path (where your application resides), and select a port.

### Step 3: Set Application Pool
1. Create an Application Pool under the application tab.
2. Ensure it runs under the correct .NET version required by your application.

## Azure AD Authentication
### Step 1: Register the Application in Azure AD
1. Go to Azure Portal and navigate to Azure Active Directory.
2. Click on "App registrations" > "New registration".
3. Fill in the required fields such as name, redirect URI, etc.

### Step 2: Configure Permissions
1. In the application registration, navigate to "API permissions".
2. Add the permissions your application will need to call APIs securely.

## SQL Server Database Configuration
### Step 1: Install SQL Server
1. Download SQL Server from the official website.
2. Follow the installation wizard steps to configure your SQL Server instance.

### Step 2: Create Database
1. Open SQL Server Management Studio.
2. Right-click on Databases and select "New Database...".
3. Name your database and set up initial configurations as needed.

## Authentication Flow
- User navigates to the web application hosted on IIS.
- User attempts to access the secured parts of the application.
- The application redirects the user to Azure AD for authentication.
- Upon successful authentication, Azure AD redirects the user back with a token.
- The application uses this token to create a session for the user.

## Database Architecture
### Overview of Database Design
- Include entities such as Users, Audits, and Reports.
- Show relationships between tables for efficient data retrieval.

### Example Schema Layout
```sql
CREATE TABLE Users (
    UserId INT PRIMARY KEY,
    Username NVARCHAR(50),
    Email NVARCHAR(100)
);

CREATE TABLE Audits (
    AuditId INT PRIMARY KEY,
    UserId INT,
    AuditDate DATETIME,
    FOREIGN KEY(UserId) REFERENCES Users(UserId)
);
```  

## Security Considerations
- Enforce HTTPS for all communication.
- Use strong passwords and change them regularly for Azure AD accounts.
- Implement roles and permissions for database access.

## Requirements
1. Windows Server 2016 or newer.
2. IIS installed and configured.
3. Azure AD tenant with permissions for application registration.
4. SQL Server 2019 or newer.

## Information Required by IT
- Application name and description.
- Required access permissions for Azure AD.
- Details about the database structure and access policies.

## Conclusion
This document serves as a guideline for establishing the Physics Audit Tool setup with necessary configurations. Ensure to adhere strictly to security best practices and organizational policies throughout the setup.