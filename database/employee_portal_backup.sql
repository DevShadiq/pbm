-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: employee_portal
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `employee_portal`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `employee_portal` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `employee_portal`;

--
-- Table structure for table `admin_user`
--

DROP TABLE IF EXISTS `admin_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_user` (
  `USER_ID` bigint NOT NULL AUTO_INCREMENT,
  `USERNAME` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PASSWORD_HASH` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DISPLAY_NAME` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ACTIVE_YN` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Y',
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`USER_ID`),
  UNIQUE KEY `UK_ADMIN_USERNAME` (`USERNAME`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_user`
--

LOCK TABLES `admin_user` WRITE;
/*!40000 ALTER TABLE `admin_user` DISABLE KEYS */;
INSERT INTO `admin_user` VALUES (1,'sadiq','$2b$12$TU3cNVhC9GBiWaBpIeEygOwsCcgazhLIDAU/ZAL8SZ75N/Zsa82HW','Administrator','Y','2026-08-27 11:50:07'),(2,'mahmudalam','$2b$12$kdz5B8CabbCHIV/qFN2EAuZzOdkkHXqUxcnm6C5x.VwNXDxeCRM7m','Admin','Y','2026-08-27 12:12:42'),(3,'admin','$2b$12$yyyKQKEq5iuM63I4wBi3eugvRqYHhv5OKtQcoeGx7New1Hxk2yf1i','admin','Y','2026-08-27 10:22:12');
/*!40000 ALTER TABLE `admin_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hr_batch_control`
--

DROP TABLE IF EXISTS `hr_batch_control`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hr_batch_control` (
  `BATCH_NO` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `STATUS` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'INACTIVE',
  `STARTED_AT` datetime DEFAULT NULL,
  `CLOSED_AT` datetime DEFAULT NULL,
  `CREATED_BY` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UPDATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`BATCH_NO`),
  KEY `IX_BATCH_STATUS` (`STATUS`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hr_batch_control`
--

LOCK TABLES `hr_batch_control` WRITE;
/*!40000 ALTER TABLE `hr_batch_control` DISABLE KEYS */;
INSERT INTO `hr_batch_control` VALUES ('BATCH-2026-01','ACTIVE','2026-08-27 12:13:13',NULL,'mahmudalam','2026-08-27 12:13:11','2026-08-27 11:48:08'),('BATCH-2026-02','INACTIVE','2026-08-27 12:19:47','2026-08-27 12:19:54','mahmudalam','2026-08-27 12:19:35','2026-08-27 12:19:54'),('BATCH-2026-03','INACTIVE','2026-08-27 12:19:43','2026-08-27 11:48:03','mahmudalam','2026-08-27 12:19:39','2026-08-27 11:48:03'),('BATCH-2026-04','INACTIVE',NULL,NULL,'sadiq','2026-08-27 11:48:17','2026-08-27 11:48:17'),('BATCH-2026-05','INACTIVE',NULL,NULL,'sadiq','2026-08-27 11:48:26','2026-08-27 11:48:26'),('BATCH-2026-06','INACTIVE',NULL,NULL,'sadiq','2026-08-27 11:48:32','2026-08-27 11:48:32'),('BATCH-2026-07','INACTIVE',NULL,NULL,'sadiq','2026-08-27 11:48:42','2026-08-27 11:48:42');
/*!40000 ALTER TABLE `hr_batch_control` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hr_empexamdet`
--

DROP TABLE IF EXISTS `hr_empexamdet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hr_empexamdet` (
  `SLNO` bigint NOT NULL,
  `EMP_ENTRY_ID` bigint NOT NULL,
  `EMPCODE` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EXAMNAME` varchar(170) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EXAMGROUP` varchar(170) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `BOARD` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CLAS` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PASSYEAR` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `REMARKS` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `INSTITUTE` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `SUBJECT_NAME` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`EMP_ENTRY_ID`,`SLNO`),
  KEY `IX_EXAM_ENTRY` (`EMP_ENTRY_ID`),
  KEY `IX_EXAM_EMPCODE` (`EMPCODE`),
  CONSTRAINT `FK_EXAM_EMP_ENTRY` FOREIGN KEY (`EMP_ENTRY_ID`) REFERENCES `up_emp` (`EMP_ENTRY_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hr_empexamdet`
--

LOCK TABLES `hr_empexamdet` WRITE;
/*!40000 ALTER TABLE `hr_empexamdet` DISABLE KEYS */;
INSERT INTO `hr_empexamdet` VALUES (1,1,'IPI-009129','Fazil','BITS','Islamic University','3.17','2017',NULL,NULL,NULL),(1,2,NULL,'SSC / Dakhil','Science','Jeshore','R.18','2006','Ok','Satkhira','Science');
/*!40000 ALTER TABLE `hr_empexamdet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hr_update_request`
--

DROP TABLE IF EXISTS `hr_update_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hr_update_request` (
  `REQUEST_ID` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EMP_ENTRY_ID` bigint NOT NULL,
  `IPI` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MERITLIST_ID` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CLASS_ID` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BATCH_NO` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `REQUEST_NOTE` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `REQUESTED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `STATUS` enum('PENDING','APPROVED','REJECTED','EXPIRED') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'PENDING',
  `APPROVED_AT` datetime DEFAULT NULL,
  `APPROVED_UNTIL` datetime DEFAULT NULL,
  `APPROVED_BY` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ADMIN_REMARKS` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UPDATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`REQUEST_ID`),
  KEY `IX_REQ_ENTRY_STATUS` (`EMP_ENTRY_ID`,`STATUS`),
  KEY `IX_REQ_APPROVED_UNTIL` (`APPROVED_UNTIL`),
  KEY `FK_REQ_BATCH` (`BATCH_NO`),
  CONSTRAINT `FK_REQ_BATCH` FOREIGN KEY (`BATCH_NO`) REFERENCES `hr_batch_control` (`BATCH_NO`),
  CONSTRAINT `FK_REQ_EMP_ENTRY` FOREIGN KEY (`EMP_ENTRY_ID`) REFERENCES `up_emp` (`EMP_ENTRY_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hr_update_request`
--

LOCK TABLES `hr_update_request` WRITE;
/*!40000 ALTER TABLE `hr_update_request` DISABLE KEYS */;
INSERT INTO `hr_update_request` VALUES ('bc11559b-e641-4bf6-88c6-4a94f0fc1a50',1,'IPI-009129','101','01','BATCH-2026-01','Need to Add Education Information','2026-08-27 12:22:23','EXPIRED','2026-08-27 12:22:56','2026-08-28 12:22:56','mahmudalam','Please Fillup data','2026-08-30 03:55:25');
/*!40000 ALTER TABLE `hr_update_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `up_emp`
--

DROP TABLE IF EXISTS `up_emp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `up_emp` (
  `EMP_ENTRY_ID` bigint NOT NULL AUTO_INCREMENT,
  `MERITLIST_ID` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CLASS_ID` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IPI` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `APPROVAL_STATUS` enum('PENDING','APPROVED','REJECTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'APPROVED',
  `APPROVED_BY` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `APPROVED_AT` datetime DEFAULT NULL,
  `NAME` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BIRTHDATE` date DEFAULT NULL,
  `BLD_GROUP` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GENDER` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `RELIGION` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `NATIONALITY` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MARITAL_STATUS` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EMAIL` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PHONE` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PHONE1` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `HEIGHT` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `WEIGHT` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `NID` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PERMANENT_VILLAGE` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PERMANENT_POST` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PERMANENT_THANA` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PERMANENT_DISTRICT` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PRESENT_VILLAGE` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PRESENT_POST` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PRESENT_THANA` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PRESENT_DISTRICT` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EMGRCNY_PERSON` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EMGRCNY_RELATION` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EMGRCNY_ADDRESS` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EMGRCNY_PHONE` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `FATHER_NAME` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `FATHER_PHONE` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MOTHER_NAME` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MOTHER_PHONE` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `SPOUSE_NAME` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `SPOSE_MARRIAGE_DATE` date DEFAULT NULL,
  `SPOSE_OCCUPATION` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `SPOUSE_PHONE` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GRNT_NAME` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GRNT_RELE` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GRNT_FATHER` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GRNT_PRESENT_ADD` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GRNT_PERMANET_ADD` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GRNT_NATIONALITY` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GRNT_PROFFESSION` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GRNT_NID` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GRNT_MOBILE` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CREATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UPDATED_AT` datetime DEFAULT NULL,
  PRIMARY KEY (`EMP_ENTRY_ID`),
  UNIQUE KEY `UK_EMP_MERIT_CLASS` (`MERITLIST_ID`,`CLASS_ID`),
  UNIQUE KEY `UK_EMP_IPI` (`IPI`),
  KEY `IX_UP_EMP_BATCH` (`batch_no`),
  KEY `IX_EMP_VERIFY` (`MERITLIST_ID`,`CLASS_ID`,`PHONE`),
  KEY `IX_UP_EMP_APPROVAL` (`APPROVAL_STATUS`),
  CONSTRAINT `FK_UP_EMP_BATCH` FOREIGN KEY (`batch_no`) REFERENCES `hr_batch_control` (`BATCH_NO`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `up_emp`
--

LOCK TABLES `up_emp` WRITE;
/*!40000 ALTER TABLE `up_emp` DISABLE KEYS */;
INSERT INTO `up_emp` VALUES (1,'101','01','IPI-009129','APPROVED','sadiq','2026-08-27 12:55:21','Md. Sadiqur Rahman','BATCH-2026-01','1997-12-30','AB-','M','I','Bangladeshi','U','shadiqur.it@gmail.com','01996200797','01709645125','5\' 3\"','62kg','4203692415','Baniabari','Mahmudpur','Melandaha','Jamalpur','Baniabari','Mahmudpur','Melandaha','Jamalpur','Ataur Rahman','Father',NULL,'01728183469','Ataur Rahman','01728183469','Sawda Begum','01728183469','Arafat Jahan','2007-12-09','Student','01996200797','Ataur Rahman','Father','AB Samad Mondol','Baniabari, Mahmudpur, Melandaha, Jamalpur','Baniabari, Mahmudpur, Melandaha, Jamalpur','Bangladeshi',NULL,NULL,NULL,'2026-08-27 12:17:40','2026-08-27 11:50:47'),(2,'1','1',NULL,'APPROVED','sadiq','2026-08-30 04:02:52','Mahmud hasan','BATCH-2026-01','2026-08-21','B+','M','I','Bangladesh','M','mahmudhasanalam91@gmail.com','01709649354','01918589368','5.5','56 kg','7772522400','Chackbara','Hainbari','Shyamanagar','Satkhira','Chackbara','Hainbari','Shyamanagar','Satkhira','Samim','Brother','3 Asadgate, Tanin Center, Mihammadpur, Dhaka','01709649364','Mostafa shahidullah','01912379624','Saleha khatun','01954381368','Sayedatun Neaa','2026-08-28','Nurse','01779133646','Mostafa shahidullah','Father','Nojib mollah','3 Asadgate, Tanin Center, Mihammadpur, Dhaka','Bosila','4448882920','Business','9999yywiwi2','01012379624','2026-08-30 03:20:57','2026-08-30 04:02:52');
/*!40000 ALTER TABLE `up_emp` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-30 10:22:51
