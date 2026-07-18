-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: sms
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
-- Current Database: `sms`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `sms` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `sms`;

--
-- Table structure for table `academic_batches`
--

DROP TABLE IF EXISTS `academic_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_batches` (
  `batch_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `academic_year_id` bigint NOT NULL,
  `class_id` bigint NOT NULL,
  `group_id` bigint DEFAULT NULL,
  `section_id` bigint DEFAULT NULL,
  `medium_id` bigint DEFAULT NULL,
  `shift_id` bigint DEFAULT NULL,
  `classroom_id` bigint DEFAULT NULL,
  `batch_name` varchar(150) NOT NULL,
  `capacity` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`batch_id`),
  UNIQUE KEY `uk_academic_batches` (`branch_id`,`academic_year_id`,`class_id`,`group_id`,`section_id`,`medium_id`,`shift_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_batches`
--

LOCK TABLES `academic_batches` WRITE;
/*!40000 ALTER TABLE `academic_batches` DISABLE KEYS */;
INSERT INTO `academic_batches` VALUES (1,3,3,14,8,6,6,3,2,'BATCH2027SSC',300,'ACTIVE','2026-06-11 02:51:38','2026-07-17 23:17:11');
/*!40000 ALTER TABLE `academic_batches` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_academic_batches_updated_at` BEFORE UPDATE ON `academic_batches` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `academic_levels`
--

DROP TABLE IF EXISTS `academic_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_levels` (
  `level_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint DEFAULT NULL,
  `level_code` varchar(30) NOT NULL,
  `level_name` varchar(100) NOT NULL,
  `level_name_bn` varchar(100) DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`level_id`),
  UNIQUE KEY `uk_academic_levels_code` (`institution_id`,`level_code`),
  CONSTRAINT `fk_academic_levels_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_levels`
--

LOCK TABLES `academic_levels` WRITE;
/*!40000 ALTER TABLE `academic_levels` DISABLE KEYS */;
INSERT INTO `academic_levels` VALUES (2,1,'L1','Primary','প্রাথমিক',1,'ACTIVE','2026-07-17 22:25:29','2026-07-17 22:25:29'),(3,1,'L2','High School','মাধ্যমিক',2,'ACTIVE','2026-07-17 22:26:04','2026-07-17 22:26:04'),(4,1,'L3','Collage','কলেজ ',3,'ACTIVE','2026-07-17 22:31:40','2026-07-17 22:31:40');
/*!40000 ALTER TABLE `academic_levels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `academic_sessions`
--

DROP TABLE IF EXISTS `academic_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_sessions` (
  `session_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `academic_year_id` bigint DEFAULT NULL,
  `session_name` varchar(80) NOT NULL,
  `session_type` varchar(50) DEFAULT 'ACADEMIC',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `uk_academic_sessions` (`institution_id`,`session_name`,`session_type`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_sessions`
--

LOCK TABLES `academic_sessions` WRITE;
/*!40000 ALTER TABLE `academic_sessions` DISABLE KEYS */;
INSERT INTO `academic_sessions` VALUES (3,1,3,'Spring 2026','SPRING','2026-07-01','2026-12-31',1,'ACTIVE','2026-07-17 22:12:08','2026-07-18 13:33:11');
/*!40000 ALTER TABLE `academic_sessions` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_academic_sessions_updated_at` BEFORE UPDATE ON `academic_sessions` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `academic_years`
--

DROP TABLE IF EXISTS `academic_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_years` (
  `academic_year_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `year_name` varchar(30) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`academic_year_id`),
  UNIQUE KEY `uk_academic_years` (`institution_id`,`year_name`),
  CONSTRAINT `chk_academic_year_dates` CHECK ((`end_date` >= `start_date`))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_years`
--

LOCK TABLES `academic_years` WRITE;
/*!40000 ALTER TABLE `academic_years` DISABLE KEYS */;
INSERT INTO `academic_years` VALUES (3,1,'2026','2026-07-01','2026-12-31',1,'ACTIVE','2026-07-17 22:11:10','2026-07-17 22:11:10');
/*!40000 ALTER TABLE `academic_years` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_academic_years_updated_at` BEFORE UPDATE ON `academic_years` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `app_users`
--

DROP TABLE IF EXISTS `app_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint DEFAULT NULL,
  `branch_id` bigint DEFAULT NULL,
  `username` varchar(80) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `password_hash` text NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `user_type` varchar(30) NOT NULL DEFAULT 'STAFF',
  `avatar_url` text,
  `is_super_admin` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_inst_branch` (`institution_id`,`branch_id`),
  CONSTRAINT `chk_app_users_type` CHECK ((`user_type` in (_utf8mb4'SUPER_ADMIN',_utf8mb4'ADMIN',_utf8mb4'TEACHER',_utf8mb4'STAFF',_utf8mb4'STUDENT',_utf8mb4'GUARDIAN')))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_users`
--

LOCK TABLES `app_users` WRITE;
/*!40000 ALTER TABLE `app_users` DISABLE KEYS */;
INSERT INTO `app_users` VALUES (1,NULL,NULL,'admin','admin@school.com','01700000000','$2a$10$9IGjeBVdlMgdAPEOMz5mZ.xVnOIQ19eoXU/vEoWn9eKdATNrstxTC','System Super Admin','SUPER_ADMIN',NULL,1,1,'2026-06-25 20:15:38','2026-06-11 00:58:01','2026-06-11 00:58:01','2026-06-25 20:15:38'),(2,1,NULL,'sadiq@pbm.com','sadiq@pbm.com','01996200797','$2b$10$7qB.v0NWhQJAOkhL/nzka.5HpwEdLewyLP575rx1a5PqKDc4BQwaK','MD Shadiqur Rahman','ADMIN',NULL,0,1,'2026-07-18 20:35:57','2026-07-17 15:26:19','2026-06-11 01:25:16','2026-07-18 20:35:57'),(6,1,NULL,'rolesmoke1784280675564','rolesmoke1784280675564@example.test',NULL,'$2b$10$8n6b3jC.ZTXd/Lw5LUhG2.k/2QS3Ij0GavUKsndwfQw47sJnG2moy','Role User 1784280675564','STAFF',NULL,0,1,NULL,'2026-07-17 15:31:15','2026-07-17 15:31:15','2026-07-17 15:39:43');
/*!40000 ALTER TABLE `app_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_app_users_updated_at` BEFORE UPDATE ON `app_users` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `attendance_devices`
--

DROP TABLE IF EXISTS `attendance_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_devices` (
  `device_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `device_code` varchar(50) NOT NULL,
  `device_name` varchar(120) NOT NULL,
  `device_type` varchar(50) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `location_name` varchar(120) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`device_id`),
  UNIQUE KEY `uk_attendance_devices` (`branch_id`,`device_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_devices`
--

LOCK TABLES `attendance_devices` WRITE;
/*!40000 ALTER TABLE `attendance_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `audit_log_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `table_name` varchar(120) NOT NULL,
  `record_id` bigint DEFAULT NULL,
  `action_type` varchar(30) NOT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_log_id`),
  KEY `idx_audit_logs_table_record` (`table_name`,`record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_accounts`
--

DROP TABLE IF EXISTS `bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_accounts` (
  `bank_account_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `account_id` bigint DEFAULT NULL,
  `bank_name` varchar(120) NOT NULL,
  `branch_name` varchar(120) DEFAULT NULL,
  `account_name` varchar(150) NOT NULL,
  `account_no` varchar(80) NOT NULL,
  `routing_no` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`bank_account_id`),
  UNIQUE KEY `uk_bank_accounts` (`institution_id`,`account_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_accounts`
--

LOCK TABLES `bank_accounts` WRITE;
/*!40000 ALTER TABLE `bank_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_categories`
--

DROP TABLE IF EXISTS `book_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_categories` (
  `book_category_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `category_name` varchar(120) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`book_category_id`),
  UNIQUE KEY `uk_book_categories` (`institution_id`,`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_categories`
--

LOCK TABLES `book_categories` WRITE;
/*!40000 ALTER TABLE `book_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `book_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_copies`
--

DROP TABLE IF EXISTS `book_copies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_copies` (
  `book_copy_id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` bigint NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `accession_no` varchar(80) NOT NULL,
  `shelf_no` varchar(50) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `copy_status` varchar(30) NOT NULL DEFAULT 'AVAILABLE',
  PRIMARY KEY (`book_copy_id`),
  UNIQUE KEY `uk_book_copies` (`accession_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_copies`
--

LOCK TABLES `book_copies` WRITE;
/*!40000 ALTER TABLE `book_copies` DISABLE KEYS */;
/*!40000 ALTER TABLE `book_copies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `book_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `book_category_id` bigint DEFAULT NULL,
  `isbn` varchar(80) DEFAULT NULL,
  `book_title` varchar(250) NOT NULL,
  `author_name` varchar(200) DEFAULT NULL,
  `publisher_name` varchar(200) DEFAULT NULL,
  `edition` varchar(80) DEFAULT NULL,
  `publish_year` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_books_updated_at` BEFORE UPDATE ON `books` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `branch_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `branch_code` varchar(30) NOT NULL,
  `branch_name` varchar(150) NOT NULL,
  `branch_type` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address_line` text,
  `is_main_branch` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `uk_branches_code` (`institution_id`,`branch_code`),
  KEY `idx_branches_institution` (`institution_id`),
  CONSTRAINT `chk_branches_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (3,1,'M1','Main Branch','Main','0155665855',NULL,NULL,1,'ACTIVE','2026-07-17 15:44:06','2026-07-17 15:44:06');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_branches_updated_at` BEFORE UPDATE ON `branches` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `chart_of_accounts`
--

DROP TABLE IF EXISTS `chart_of_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chart_of_accounts` (
  `account_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `parent_account_id` bigint DEFAULT NULL,
  `account_code` varchar(50) NOT NULL,
  `account_name` varchar(150) NOT NULL,
  `account_type` varchar(30) NOT NULL,
  `is_postable` tinyint(1) NOT NULL DEFAULT '1',
  `opening_balance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`),
  UNIQUE KEY `uk_chart_accounts` (`institution_id`,`account_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chart_of_accounts`
--

LOCK TABLES `chart_of_accounts` WRITE;
/*!40000 ALTER TABLE `chart_of_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `chart_of_accounts` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_chart_accounts_updated_at` BEFORE UPDATE ON `chart_of_accounts` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `class_levels`
--

DROP TABLE IF EXISTS `class_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_levels` (
  `class_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `level_id` bigint DEFAULT NULL,
  `class_code` varchar(30) NOT NULL,
  `class_code_bn` varchar(45) DEFAULT NULL,
  `class_name` varchar(100) NOT NULL,
  `class_name_bn` varchar(100) DEFAULT NULL,
  `numeric_level` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`class_id`),
  UNIQUE KEY `uk_class_levels` (`institution_id`,`class_code`),
  KEY `fk_class_levels_academic_level` (`level_id`),
  CONSTRAINT `fk_class_levels_academic_level` FOREIGN KEY (`level_id`) REFERENCES `academic_levels` (`level_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_levels`
--

LOCK TABLES `class_levels` WRITE;
/*!40000 ALTER TABLE `class_levels` DISABLE KEYS */;
INSERT INTO `class_levels` VALUES (1,1,2,'CLASS-01','১ম','Class One','প্রথম শ্রেণি',1,'ACTIVE','2026-06-11 02:26:41','2026-07-18 15:35:36'),(6,1,2,'CLASS-02','২য়','Class Two','দ্বিতীয় শ্রেণি',2,'ACTIVE','2026-07-17 22:56:47','2026-07-18 15:35:30'),(7,1,2,'CLASS-03','৩য়','Class Three','তৃতীয় শ্রেণি',3,'ACTIVE','2026-07-17 22:57:02','2026-07-18 15:35:42'),(8,1,2,'CLASS-04','৪র্থ','Class Four','চতুর্থ শ্রেণি',4,'ACTIVE','2026-07-17 22:57:17','2026-07-18 15:35:50'),(9,1,2,'CLASS-05','৫ম','Class Five','পঞ্চম শ্রেণি',5,'ACTIVE','2026-07-17 22:57:34','2026-07-18 15:35:57'),(10,1,3,'CLASS-06','৬ষ্ঠ','Class Six','ষষ্ঠ শ্রেণি',6,'ACTIVE','2026-07-17 22:57:48','2026-07-18 15:36:11'),(11,1,3,'CLASS-07','৭ম','Class Seven','সপ্তম শ্রেণি',7,'ACTIVE','2026-07-17 22:58:06','2026-07-18 15:36:05'),(12,1,3,'CLASS-08','৮ম','Class Eight','অষ্টম শ্রেণি',8,'ACTIVE','2026-07-17 22:58:32','2026-07-18 15:36:21'),(13,1,3,'CLASS-09','৯ম','Class Nine','নবম শ্রেণি',9,'ACTIVE','2026-07-17 22:58:49','2026-07-18 15:36:27'),(14,1,3,'CLASS-10','১০ম','Class Ten','দশম শ্রেণি',10,'ACTIVE','2026-07-17 22:59:28','2026-07-18 15:36:36'),(15,1,4,'CLASS-11','১১শ','HSC 1st Year','একাদশ  শ্রেণি',11,'ACTIVE','2026-07-18 15:49:12','2026-07-18 15:49:12'),(16,1,4,'CLASS-12','১২শ','HSC 2nd Year','দ্বাদশ শ্রেণি',12,'ACTIVE','2026-07-18 15:50:09','2026-07-18 15:50:09');
/*!40000 ALTER TABLE `class_levels` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_class_levels_updated_at` BEFORE UPDATE ON `class_levels` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `class_routines`
--

DROP TABLE IF EXISTS `class_routines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_routines` (
  `routine_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `academic_year_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `day_name` varchar(15) NOT NULL,
  `period_no` int NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `subject_id` bigint DEFAULT NULL,
  `teacher_id` bigint DEFAULT NULL,
  `classroom_id` bigint DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`routine_id`),
  UNIQUE KEY `uk_class_routine` (`batch_id`,`day_name`,`period_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_routines`
--

LOCK TABLES `class_routines` WRITE;
/*!40000 ALTER TABLE `class_routines` DISABLE KEYS */;
/*!40000 ALTER TABLE `class_routines` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_class_routines_updated_at` BEFORE UPDATE ON `class_routines` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `class_subjects`
--

DROP TABLE IF EXISTS `class_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_subjects` (
  `class_subject_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `class_id` bigint NOT NULL,
  `group_id` bigint DEFAULT NULL,
  `subject_id` bigint NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`class_subject_id`),
  UNIQUE KEY `uk_class_subjects` (`class_id`,`group_id`,`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_subjects`
--

LOCK TABLES `class_subjects` WRITE;
/*!40000 ALTER TABLE `class_subjects` DISABLE KEYS */;
/*!40000 ALTER TABLE `class_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classrooms`
--

DROP TABLE IF EXISTS `classrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classrooms` (
  `classroom_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `room_no` varchar(50) NOT NULL,
  `building_name` varchar(100) DEFAULT NULL,
  `floor_no` varchar(30) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`classroom_id`),
  UNIQUE KEY `uk_classrooms` (`branch_id`,`room_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classrooms`
--

LOCK TABLES `classrooms` WRITE;
/*!40000 ALTER TABLE `classrooms` DISABLE KEYS */;
INSERT INTO `classrooms` VALUES (2,3,'001','South Building','1',50,'ACTIVE');
/*!40000 ALTER TABLE `classrooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `department_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `department_code` varchar(30) NOT NULL,
  `department_name` varchar(120) NOT NULL,
  `department_name_bn` varchar(120) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `uk_departments` (`institution_id`,`department_code`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (2,1,'G01','General','সাধারণ','ACTIVE'),(5,1,'MGR','Management','ব্যবস্থাপনা','ACTIVE'),(6,1,'ACT01','Finance and Accounts','অর্থ ও হিসাব বিভাগ','ACTIVE'),(10,1,'GEN','General','সাধারণ','ACTIVE'),(11,1,'ADM','Administration','প্রশাসন','ACTIVE'),(12,1,'ACC','Finance and Accounts','অর্থ ও হিসাব বিভাগ','ACTIVE'),(13,1,'HRM','Human Resource Management','মানবসম্পদ ব্যবস্থাপনা','ACTIVE'),(14,1,'LIB','Library','গ্রন্থাগার','ACTIVE'),(15,1,'ICTA','ICT and Technical Support','আইসিটি ও কারিগরি সহায়তা','ACTIVE'),(16,1,'EXAM','Examination Control','পরীক্ষা নিয়ন্ত্রণ বিভাগ','ACTIVE'),(17,1,'ADMS','Admission','ভর্তি বিভাগ','ACTIVE'),(18,1,'STW','Student Welfare','শিক্ষার্থী কল্যাণ বিভাগ','ACTIVE'),(19,1,'BAN','Bangla','বাংলা','ACTIVE'),(20,1,'ENG','English','ইংরেজি','ACTIVE'),(21,1,'MAT','Mathematics','গণিত','ACTIVE'),(22,1,'BGS','Bangladesh and Global Studies','বাংলাদেশ ও বিশ্বপরিচয়','ACTIVE'),(23,1,'SCI','General Science','সাধারণ বিজ্ঞান','ACTIVE'),(24,1,'ICT','Information and Communication Technology','তথ্য ও যোগাযোগ প্রযুক্তি','ACTIVE'),(25,1,'REL','Religious Studies','ধর্ম ও নৈতিক শিক্ষা','ACTIVE'),(26,1,'PEH','Physical Education and Health','শারীরিক শিক্ষা ও স্বাস্থ্য','ACTIVE'),(27,1,'ART','Arts and Crafts','চারু ও কারুকলা','ACTIVE'),(28,1,'MUS','Music','সংগীত','ACTIVE'),(29,1,'AGR','Agricultural Studies','কৃষিশিক্ষা','ACTIVE'),(30,1,'HSC','Home Science','গার্হস্থ্য বিজ্ঞান','ACTIVE'),(31,1,'CARE','Career Education','কর্ম ও জীবনমুখী শিক্ষা','ACTIVE'),(32,1,'SCIG','Science Group','বিজ্ঞান বিভাগ','ACTIVE'),(33,1,'PHY','Physics','পদার্থবিজ্ঞান','ACTIVE'),(34,1,'CHE','Chemistry','রসায়ন','ACTIVE'),(35,1,'BIO','Biology','জীববিজ্ঞান','ACTIVE'),(36,1,'HMAT','Higher Mathematics','উচ্চতর গণিত','ACTIVE'),(37,1,'BOT','Botany','উদ্ভিদবিজ্ঞান','ACTIVE'),(38,1,'ZOO','Zoology','প্রাণিবিজ্ঞান','ACTIVE'),(39,1,'STAT','Statistics','পরিসংখ্যান','ACTIVE'),(40,1,'ENV','Environmental Science','পরিবেশবিজ্ঞান','ACTIVE'),(41,1,'BUS','Business Studies Group','ব্যবসায় শিক্ষা বিভাগ','ACTIVE'),(42,1,'ACT','Accounting','হিসাববিজ্ঞান','ACTIVE'),(43,1,'FIN','Finance, Banking and Insurance','ফিন্যান্স, ব্যাংকিং ও বিমা','ACTIVE'),(44,1,'BENT','Business Entrepreneurship','ব্যবসায় উদ্যোগ','ACTIVE'),(45,1,'MGT','Management','ব্যবস্থাপনা','ACTIVE'),(46,1,'MKT','Marketing','বিপণন','ACTIVE'),(47,1,'PROD','Production Management and Marketing','উৎপাদন ব্যবস্থাপনা ও বিপণন','ACTIVE'),(48,1,'BORG','Business Organization and Management','ব্যবসায় সংগঠন ও ব্যবস্থাপনা','ACTIVE'),(49,1,'HUM','Humanities Group','মানবিক বিভাগ','ACTIVE'),(50,1,'HIS','History','ইতিহাস','ACTIVE'),(51,1,'ISLH','History and Culture of Islam','ইসলামের ইতিহাস ও সংস্কৃতি','ACTIVE'),(52,1,'GEO','Geography and Environment','ভূগোল ও পরিবেশ','ACTIVE'),(53,1,'ECO','Economics','অর্থনীতি','ACTIVE'),(54,1,'CIV','Civics and Good Governance','পৌরনীতি ও সুশাসন','ACTIVE'),(55,1,'SOC','Sociology','সমাজবিজ্ঞান','ACTIVE'),(56,1,'SWK','Social Work','সমাজকর্ম','ACTIVE'),(57,1,'LOG','Logic','যুক্তিবিদ্যা','ACTIVE'),(58,1,'PSY','Psychology','মনোবিজ্ঞান','ACTIVE'),(59,1,'ARB','Arabic','আরবি','ACTIVE'),(60,1,'SAN','Sanskrit','সংস্কৃত','ACTIVE'),(61,1,'PAL','Pali','পালি','ACTIVE'),(62,1,'URD','Urdu','উর্দু','ACTIVE'),(63,1,'BENL','Bangla Language and Literature','বাংলা ভাষা ও সাহিত্য','ACTIVE'),(64,1,'ENGL','English Language and Literature','ইংরেজি ভাষা ও সাহিত্য','ACTIVE'),(65,1,'MGEN','Madrasa General Studies','মাদ্রাসা সাধারণ শিক্ষা','ACTIVE'),(66,1,'QUR','Quran Majid and Tajweed','কুরআন মাজিদ ও তাজবিদ','ACTIVE'),(67,1,'HAD','Hadith Sharif','হাদিস শরিফ','ACTIVE'),(68,1,'AQA','Aqaid and Fiqh','আকাইদ ও ফিকহ','ACTIVE'),(69,1,'FQH','Fiqh','ফিকহ','ACTIVE'),(70,1,'USF','Usul al-Fiqh','উসূলুল ফিকহ','ACTIVE'),(71,1,'TAF','Tafsir','তাফসির','ACTIVE'),(72,1,'AQD','Aqaid','আকাইদ','ACTIVE'),(73,1,'BAL','Balaghat and Mantiq','বালাগাত ও মানতিক','ACTIVE'),(74,1,'ARB1','Arabic First Paper','আরবি প্রথম পত্র','ACTIVE'),(75,1,'ARB2','Arabic Second Paper','আরবি দ্বিতীয় পত্র','ACTIVE'),(76,1,'ISLA','Islamic Studies','ইসলাম শিক্ষা','ACTIVE'),(77,1,'DAW','Dawah and Islamic Studies','দাওয়াহ ও ইসলামি শিক্ষা','ACTIVE'),(78,1,'HIFZ','Hifzul Quran','হিফজুল কুরআন','ACTIVE'),(79,1,'VOC','Vocational Education','ভোকেশনাল শিক্ষা','ACTIVE'),(80,1,'CSE','Computer Science and Technology','কম্পিউটার সায়েন্স ও প্রযুক্তি','ACTIVE'),(81,1,'CIVIL','Civil Technology','সিভিল প্রযুক্তি','ACTIVE'),(82,1,'ELECT','Electrical Technology','ইলেকট্রিক্যাল প্রযুক্তি','ACTIVE'),(83,1,'ELEC','Electronics Technology','ইলেকট্রনিক্স প্রযুক্তি','ACTIVE'),(84,1,'MECH','Mechanical Technology','মেকানিক্যাল প্রযুক্তি','ACTIVE'),(85,1,'AUTO','Automobile Technology','অটোমোবাইল প্রযুক্তি','ACTIVE'),(86,1,'TEXT','Textile Technology','টেক্সটাইল প্রযুক্তি','ACTIVE'),(87,1,'ARCH','Architecture Technology','আর্কিটেকচার প্রযুক্তি','ACTIVE'),(88,1,'RAC','Refrigeration and Air Conditioning','রেফ্রিজারেশন ও এয়ার কন্ডিশনিং','ACTIVE'),(89,1,'GD','Graphic Design','গ্রাফিক ডিজাইন','ACTIVE'),(90,1,'FD','Food Technology','ফুড প্রযুক্তি','ACTIVE'),(91,1,'AGT','Agricultural Technology','কৃষি প্রযুক্তি','ACTIVE'),(92,1,'FISH','Fisheries Technology','মৎস্য প্রযুক্তি','ACTIVE'),(93,1,'LIVE','Livestock Technology','প্রাণিসম্পদ প্রযুক্তি','ACTIVE'),(94,1,'CS','Computer Science','কম্পিউটার বিজ্ঞান','ACTIVE'),(95,1,'CSEU','Computer Science and Engineering','কম্পিউটার বিজ্ঞান ও প্রকৌশল','ACTIVE'),(96,1,'EEE','Electrical and Electronic Engineering','তড়িৎ ও ইলেকট্রনিক প্রকৌশল','ACTIVE'),(97,1,'CE','Civil Engineering','পুরকৌশল','ACTIVE'),(98,1,'ME','Mechanical Engineering','যন্ত্রকৌশল','ACTIVE'),(99,1,'BBA','Business Administration','ব্যবসায় প্রশাসন','ACTIVE'),(100,1,'LAW','Law','আইন','ACTIVE'),(101,1,'EDU','Education','শিক্ষা','ACTIVE'),(102,1,'PHIL','Philosophy','দর্শন','ACTIVE'),(103,1,'POL','Political Science','রাষ্ট্রবিজ্ঞান','ACTIVE'),(104,1,'PAD','Public Administration','লোকপ্রশাসন','ACTIVE');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designations`
--

DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designations` (
  `designation_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `designation_code` varchar(30) NOT NULL,
  `designation_name` varchar(120) NOT NULL,
  `designation_name_bn` varchar(120) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`designation_id`),
  UNIQUE KEY `uk_designations` (`institution_id`,`designation_code`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
INSERT INTO `designations` VALUES (1,1,'HT001','Head Teacher','প্রধান শিক্ষক','ACTIVE'),(2,1,'AHT001','Assistant Head Teacher','সহকারী প্রধান শিক্ষক','ACTIVE'),(3,1,'SST001','Senior Teacher','সিনিয়র শিক্ষক','ACTIVE'),(4,1,'AST002','Assistant Teacher','সহকারী শিক্ষক','ACTIVE'),(5,1,'JST001','Junior Teacher','জুনিয়র শিক্ষক','ACTIVE'),(6,1,'PT001','Primary Teacher','প্রাথমিক শিক্ষক','ACTIVE'),(7,1,'APRT01','Assistant Primary Teacher','সহকারী প্রাথমিক শিক্ষক','ACTIVE'),(8,1,'PRET01','Pre-Primary Teacher','প্রাক-প্রাথমিক শিক্ষক','ACTIVE'),(9,1,'SUBT01','Subject Teacher','বিষয় শিক্ষক','ACTIVE'),(10,1,'CLST01','Class Teacher','শ্রেণি শিক্ষক','ACTIVE'),(11,1,'GRT001','Graduate Teacher','স্নাতক শিক্ষক','ACTIVE'),(12,1,'PGT001','Post Graduate Teacher','স্নাতকোত্তর শিক্ষক','ACTIVE'),(13,1,'DEMT01','Demonstrator','প্রদর্শক','ACTIVE'),(14,1,'LABT01','Laboratory Teacher','ল্যাবরেটরি শিক্ষক','ACTIVE'),(15,1,'PET001','Physical Education Teacher','শারীরিক শিক্ষা শিক্ষক','ACTIVE'),(16,1,'MUST01','Music Teacher','সংগীত শিক্ষক','ACTIVE'),(17,1,'ARTT01','Arts and Crafts Teacher','চারু ও কারুকলা শিক্ষক','ACTIVE'),(18,1,'ICTT01','ICT Teacher','আইসিটি শিক্ষক','ACTIVE'),(19,1,'RELT01','Religious Studies Teacher','ধর্মীয় শিক্ষা শিক্ষক','ACTIVE'),(20,1,'LIBT01','Library Teacher','গ্রন্থাগার শিক্ষক','ACTIVE'),(21,1,'LABAS1','Laboratory Assistant','ল্যাবরেটরি সহকারী','ACTIVE'),(22,1,'ADMIN1','Administrator','প্রশাসক','ACTIVE'),(23,1,'ADMIS1','Admission Officer','ভর্তি কর্মকর্তা','ACTIVE'),(24,1,'HOSTS1','Hostel Superintendent','হোস্টেল সুপারিনটেনডেন্ট','ACTIVE'),(25,1,'ACCT01','Accountant','হিসাবরক্ষক','ACTIVE'),(26,1,'CASR01','Cashier','ক্যাশিয়ার','ACTIVE'),(27,1,'STOREK','Store Keeper','স্টোর কিপার','ACTIVE'),(28,1,'ITOFF1','IT Officer','আইটি কর্মকর্তা','ACTIVE'),(29,1,'COMOP2','Computer Operator','কম্পিউটার অপারেটর','ACTIVE'),(30,1,'LIB001','Librarian','গ্রন্থাগারিক','ACTIVE'),(31,1,'HEADCL','Head Clerk','প্রধান সহকারী','ACTIVE'),(32,1,'OFFAS1','Office Assistant','অফিস সহকারী','ACTIVE'),(33,1,'RECEP1','Receptionist','অভ্যর্থনাকারী','ACTIVE'),(34,1,'PEON01','Office Peon','অফিস পিয়ন','ACTIVE'),(35,1,'MEDOF1','Medical Officer','চিকিৎসা কর্মকর্তা','ACTIVE'),(36,1,'SGRD01','Security Guard','নিরাপত্তা প্রহরী','ACTIVE'),(37,1,'DRIV01','Driver','গাড়িচালক','ACTIVE'),(38,1,'ELECT1','Electrician','ইলেকট্রিশিয়ান','ACTIVE'),(39,1,'CLEAN1','Cleaner','পরিচ্ছন্নতাকর্মী','ACTIVE'),(40,1,'COOK01','Cook','বাবুর্চি','ACTIVE'),(41,1,'ASCO01','Assistant Cook','সহকারী বাবুর্চি','ACTIVE'),(42,1,'MESSM1','Mess Manager','মেস ব্যবস্থাপক','ACTIVE'),(43,1,'AYAH01','Ayah','আয়া','ACTIVE'),(44,1,'NIGHT1','Night Guard','নৈশপ্রহরী','ACTIVE');
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `education_boards`
--

DROP TABLE IF EXISTS `education_boards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `education_boards` (
  `board_id` bigint NOT NULL AUTO_INCREMENT,
  `board_code` varchar(30) NOT NULL,
  `board_name` varchar(120) NOT NULL,
  `country_name` varchar(80) DEFAULT 'Bangladesh',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`board_id`),
  UNIQUE KEY `board_code` (`board_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `education_boards`
--

LOCK TABLES `education_boards` WRITE;
/*!40000 ALTER TABLE `education_boards` DISABLE KEYS */;
/*!40000 ALTER TABLE `education_boards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_addresses`
--

DROP TABLE IF EXISTS `employee_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_addresses` (
  `address_id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `address_type` varchar(30) NOT NULL,
  `address_line` text,
  `district` varchar(120) DEFAULT NULL,
  `division` varchar(120) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(80) DEFAULT 'Bangladesh',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  UNIQUE KEY `uk_employee_addresses` (`employee_id`,`address_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_addresses`
--

LOCK TABLES `employee_addresses` WRITE;
/*!40000 ALTER TABLE `employee_addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_addresses` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_employee_addresses_updated_at` BEFORE UPDATE ON `employee_addresses` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `employee_attendance`
--

DROP TABLE IF EXISTS `employee_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_attendance` (
  `attendance_id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `attendance_status` varchar(30) NOT NULL DEFAULT 'PRESENT',
  `device_id` bigint DEFAULT NULL,
  `remarks` text,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uk_employee_attendance` (`employee_id`,`attendance_date`),
  KEY `idx_employee_attendance_date` (`branch_id`,`attendance_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_attendance`
--

LOCK TABLES `employee_attendance` WRITE;
/*!40000 ALTER TABLE `employee_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_attendance` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_employee_attendance_updated_at` BEFORE UPDATE ON `employee_attendance` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `employee_leave_applications`
--

DROP TABLE IF EXISTS `employee_leave_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_leave_applications` (
  `leave_application_id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `leave_type_id` bigint NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `total_days` decimal(6,2) NOT NULL,
  `reason` text,
  `approval_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `approved_by` bigint DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`leave_application_id`),
  CONSTRAINT `chk_leave_dates` CHECK ((`to_date` >= `from_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_leave_applications`
--

LOCK TABLES `employee_leave_applications` WRITE;
/*!40000 ALTER TABLE `employee_leave_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_leave_applications` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_employee_leave_updated_at` BEFORE UPDATE ON `employee_leave_applications` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `employee_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `employee_no` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `first_name_bn` varchar(120) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `last_name_bn` varchar(120) DEFAULT NULL,
  `full_name` varchar(180) GENERATED ALWAYS AS (trim(concat(coalesce(`first_name`,_utf8mb4''),_utf8mb4' ',coalesce(`last_name`,_utf8mb4'')))) STORED,
  `employee_type` varchar(30) NOT NULL DEFAULT 'STAFF',
  `department_id` bigint DEFAULT NULL,
  `designation_id` bigint DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `nid_no` varchar(80) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `photo_url` text,
  `employment_status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `uk_employees_no` (`institution_id`,`employee_no`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `chk_employees_type` CHECK ((`employee_type` in (_utf8mb4'TEACHER',_utf8mb4'STAFF',_utf8mb4'ADMIN')))
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` (`employee_id`, `institution_id`, `branch_id`, `user_id`, `employee_no`, `first_name`, `first_name_bn`, `last_name`, `last_name_bn`, `employee_type`, `department_id`, `designation_id`, `joining_date`, `date_of_birth`, `gender`, `blood_group`, `religion`, `nid_no`, `mobile`, `email`, `photo_url`, `employment_status`, `created_at`, `updated_at`) VALUES (16,1,3,NULL,'E002','Esrat','ইশরাত','Jahan','জাহান','TEACHER',19,4,'2012-02-15','1990-05-21','FEMALE','B+','Islam','1987654321012','01711000002','nusrat.jahan@example.com','/uploads/employees/E002-photo-1784355408694-w-tech8.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 13:01:27'),(18,1,3,NULL,'E004','Farzana','ফারজানা','Akter','আক্তার','TEACHER',20,4,'2018-01-10','1993-03-17','FEMALE','A-','Islam','1993031700045','01711000004','farzana.akter@example.com','/uploads/employees/E004-photo-1784355427871-w-tech5.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 13:01:38'),(19,1,3,NULL,'E005','Al Amin','আল আমিন','Hossain','হোসাইন','TEACHER',21,3,'2016-04-05','1989-12-25','MALE','AB+','Islam','1989122500056','01711000005','sourav.chakraborty@example.com','/uploads/employees/E005-photo-1784355683802-tech4.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 18:29:40'),(20,1,3,NULL,'E006','Maria','মারিয়া','Akter','আক্তার','TEACHER',64,4,'2019-08-20','1994-06-12','FEMALE','O-','Christianity','1994061200067','01711000006','maria.gomes@example.com','/uploads/employees/E006-photo-1784355491682-w-tech10.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 18:30:35'),(21,1,3,NULL,'E007','Kamrul','কামরুল','Islam','ইসলাম','STAFF',6,31,'2014-03-01','1987-09-14','MALE','B-','Islam','1987091400078','01711000007','kamrul.islam@example.com','/uploads/employees/E007-photo-1784358248090-tech2.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 13:06:36'),(22,1,3,NULL,'E008','Shamima','শারমিন','Sultana','সুলতানা','ADMIN',11,22,'2017-11-12','1991-01-30','FEMALE','A+','Islam','1991013000089','01711000008','shamima.sultana@example.com','/uploads/employees/E008-photo-1784358480159-w-tech8.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 13:08:01'),(23,1,3,NULL,'E009','Rafiqul',NULL,'Alam',NULL,'TEACHER',22,2,'2020-02-01','1992-07-07','MALE','O+','Islam','1992070700091','01711000009','rafiqul.alam@example.com','/uploads/employees/E009-photo-1784355616873-tech7.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 13:03:39'),(24,1,3,NULL,'E010','Jamal','জামাল ','Hossen','হোসেন','TEACHER',33,1,'2021-05-15','1996-04-19','MALE','B+','Islam','1996041900102','01711000010','jamalhossen@example.com','/uploads/employees/E010-photo-1784355548884-techer1.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 12:19:10'),(25,1,3,NULL,'E011','Abidul','আবিদুল','Islam','ইসলাম','TEACHER',34,4,'2013-09-10','1984-02-22','MALE','A+','Islam','1984022200113','01711000011','jamal.hossain@example.com','/uploads/employees/E011-photo-1784355607562-tech9.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 13:03:22'),(26,1,3,NULL,'E012','Rubel','রুবেল','Mia','মিয়া','STAFF',6,26,'2022-01-01','1990-08-13','MALE','O+','Islam','1990081300124','01711000012','rubel.mia@example.com','/uploads/employees/E012-photo-1784358367739-tech6.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 13:06:08'),(27,1,3,NULL,'E013','Abu Sadat','আবু সাদাত','Sayem','সায়েম','TEACHER',94,4,'2023-03-05','1998-10-11','MALE','AB-','Islam','1998101100135','01711000013','abusadat@example.com','/uploads/employees/E013-photo-1784355661098-tech6.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 13:01:01'),(28,1,3,NULL,'E014','Anik','অনিক','Barua','বড়ুয়া','STAFF',11,23,'2024-06-01','1997-12-03','MALE','B+','Buddhism','1997120300146','01711000014','anik.barua@example.com','/uploads/employees/E014-photo-1784358339843-tech7.jpg','ACTIVE','2026-07-18 01:22:42','2026-07-18 13:07:10');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_employees_updated_at` BEFORE UPDATE ON `employees` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `exam_marks`
--

DROP TABLE IF EXISTS `exam_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_marks` (
  `mark_id` bigint NOT NULL AUTO_INCREMENT,
  `exam_id` bigint NOT NULL,
  `exam_subject_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `component_id` bigint DEFAULT NULL,
  `marks_obtained` decimal(8,2) NOT NULL DEFAULT '0.00',
  `is_absent` tinyint(1) NOT NULL DEFAULT '0',
  `remarks` text,
  `entered_by` bigint DEFAULT NULL,
  `entered_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`mark_id`),
  UNIQUE KEY `uk_exam_marks` (`exam_subject_id`,`student_id`,`component_id`),
  KEY `idx_exam_marks_student` (`student_id`,`exam_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_marks`
--

LOCK TABLES `exam_marks` WRITE;
/*!40000 ALTER TABLE `exam_marks` DISABLE KEYS */;
/*!40000 ALTER TABLE `exam_marks` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_exam_marks_updated_at` BEFORE UPDATE ON `exam_marks` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `exam_subject_components`
--

DROP TABLE IF EXISTS `exam_subject_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_subject_components` (
  `exam_subject_component_id` bigint NOT NULL AUTO_INCREMENT,
  `exam_subject_id` bigint NOT NULL,
  `component_id` bigint NOT NULL,
  `full_marks` decimal(8,2) NOT NULL,
  `pass_marks` decimal(8,2) DEFAULT '0.00',
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`exam_subject_component_id`),
  UNIQUE KEY `uk_exam_subject_components` (`exam_subject_id`,`component_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_subject_components`
--

LOCK TABLES `exam_subject_components` WRITE;
/*!40000 ALTER TABLE `exam_subject_components` DISABLE KEYS */;
/*!40000 ALTER TABLE `exam_subject_components` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_subjects`
--

DROP TABLE IF EXISTS `exam_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_subjects` (
  `exam_subject_id` bigint NOT NULL AUTO_INCREMENT,
  `exam_id` bigint NOT NULL,
  `subject_id` bigint NOT NULL,
  `full_marks` decimal(8,2) NOT NULL DEFAULT '100.00',
  `pass_marks` decimal(8,2) NOT NULL DEFAULT '33.00',
  `exam_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`exam_subject_id`),
  UNIQUE KEY `uk_exam_subjects` (`exam_id`,`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_subjects`
--

LOCK TABLES `exam_subjects` WRITE;
/*!40000 ALTER TABLE `exam_subjects` DISABLE KEYS */;
/*!40000 ALTER TABLE `exam_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_types`
--

DROP TABLE IF EXISTS `exam_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_types` (
  `exam_type_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `exam_type_code` varchar(30) NOT NULL,
  `exam_type_name` varchar(120) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`exam_type_id`),
  UNIQUE KEY `uk_exam_types` (`institution_id`,`exam_type_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_types`
--

LOCK TABLES `exam_types` WRITE;
/*!40000 ALTER TABLE `exam_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `exam_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `exam_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `academic_year_id` bigint NOT NULL,
  `exam_type_id` bigint NOT NULL,
  `exam_name` varchar(150) NOT NULL,
  `class_id` bigint DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `result_publish_date` date DEFAULT NULL,
  `exam_status` varchar(30) NOT NULL DEFAULT 'DRAFT',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`exam_id`),
  UNIQUE KEY `uk_exams` (`branch_id`,`academic_year_id`,`exam_type_id`,`exam_name`,`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams` DISABLE KEYS */;
/*!40000 ALTER TABLE `exams` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_exams_updated_at` BEFORE UPDATE ON `exams` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `fee_collection_lines`
--

DROP TABLE IF EXISTS `fee_collection_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_collection_lines` (
  `collection_line_id` bigint NOT NULL AUTO_INCREMENT,
  `collection_id` bigint NOT NULL,
  `invoice_id` bigint NOT NULL,
  `invoice_line_id` bigint DEFAULT NULL,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `fine_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`collection_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_collection_lines`
--

LOCK TABLES `fee_collection_lines` WRITE;
/*!40000 ALTER TABLE `fee_collection_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_collection_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_collections`
--

DROP TABLE IF EXISTS `fee_collections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_collections` (
  `collection_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `receipt_no` varchar(50) NOT NULL,
  `collection_date` date NOT NULL DEFAULT (curdate()),
  `payment_method` varchar(30) NOT NULL DEFAULT 'CASH',
  `reference_no` varchar(100) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `remarks` text,
  `collected_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`collection_id`),
  UNIQUE KEY `uk_fee_receipt_no` (`branch_id`,`receipt_no`),
  KEY `idx_fee_collections_student` (`student_id`,`collection_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_collections`
--

LOCK TABLES `fee_collections` WRITE;
/*!40000 ALTER TABLE `fee_collections` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_collections` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_fee_collections_updated_at` BEFORE UPDATE ON `fee_collections` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `fee_heads`
--

DROP TABLE IF EXISTS `fee_heads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_heads` (
  `fee_head_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `fee_code` varchar(30) NOT NULL,
  `fee_name` varchar(120) NOT NULL,
  `fee_type` varchar(30) NOT NULL DEFAULT 'REGULAR',
  `is_recurring` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`fee_head_id`),
  UNIQUE KEY `uk_fee_heads` (`institution_id`,`fee_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_heads`
--

LOCK TABLES `fee_heads` WRITE;
/*!40000 ALTER TABLE `fee_heads` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_heads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_invoice_lines`
--

DROP TABLE IF EXISTS `fee_invoice_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_invoice_lines` (
  `invoice_line_id` bigint NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint NOT NULL,
  `fee_head_id` bigint NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `fine_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `due_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `line_status` varchar(30) NOT NULL DEFAULT 'UNPAID',
  PRIMARY KEY (`invoice_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_invoice_lines`
--

LOCK TABLES `fee_invoice_lines` WRITE;
/*!40000 ALTER TABLE `fee_invoice_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_invoice_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_invoices`
--

DROP TABLE IF EXISTS `fee_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_invoices` (
  `invoice_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `enrollment_id` bigint DEFAULT NULL,
  `invoice_no` varchar(50) NOT NULL,
  `invoice_date` date NOT NULL DEFAULT (curdate()),
  `due_date` date DEFAULT NULL,
  `billing_month` int DEFAULT NULL,
  `billing_year` int DEFAULT NULL,
  `gross_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `fine_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `due_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `invoice_status` varchar(30) NOT NULL DEFAULT 'UNPAID',
  `remarks` text,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `uk_fee_invoices_no` (`branch_id`,`invoice_no`),
  KEY `idx_fee_invoices_student` (`student_id`,`invoice_status`),
  KEY `idx_fee_invoices_date` (`branch_id`,`invoice_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_invoices`
--

LOCK TABLES `fee_invoices` WRITE;
/*!40000 ALTER TABLE `fee_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_invoices` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_fee_invoices_updated_at` BEFORE UPDATE ON `fee_invoices` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `fee_structure_details`
--

DROP TABLE IF EXISTS `fee_structure_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_structure_details` (
  `fee_structure_detail_id` bigint NOT NULL AUTO_INCREMENT,
  `fee_structure_id` bigint NOT NULL,
  `fee_head_id` bigint NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `frequency` varchar(30) NOT NULL DEFAULT 'ONE_TIME',
  `due_day` int DEFAULT NULL,
  `is_optional` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`fee_structure_detail_id`),
  UNIQUE KEY `uk_fee_structure_details` (`fee_structure_id`,`fee_head_id`),
  CONSTRAINT `chk_fee_amount` CHECK ((`amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_structure_details`
--

LOCK TABLES `fee_structure_details` WRITE;
/*!40000 ALTER TABLE `fee_structure_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_structure_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_structures`
--

DROP TABLE IF EXISTS `fee_structures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_structures` (
  `fee_structure_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `academic_year_id` bigint NOT NULL,
  `class_id` bigint NOT NULL,
  `group_id` bigint DEFAULT NULL,
  `medium_id` bigint DEFAULT NULL,
  `structure_name` varchar(150) NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`fee_structure_id`),
  UNIQUE KEY `uk_fee_structures` (`branch_id`,`academic_year_id`,`class_id`,`group_id`,`medium_id`,`structure_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_structures`
--

LOCK TABLES `fee_structures` WRITE;
/*!40000 ALTER TABLE `fee_structures` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_structures` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_fee_structures_updated_at` BEFORE UPDATE ON `fee_structures` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `fee_waivers`
--

DROP TABLE IF EXISTS `fee_waivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_waivers` (
  `waiver_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `fee_head_id` bigint DEFAULT NULL,
  `waiver_type` varchar(30) NOT NULL,
  `waiver_value` decimal(12,2) NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `approval_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `approved_by` bigint DEFAULT NULL,
  `remarks` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`waiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_waivers`
--

LOCK TABLES `fee_waivers` WRITE;
/*!40000 ALTER TABLE `fee_waivers` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_waivers` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_fee_waivers_updated_at` BEFORE UPDATE ON `fee_waivers` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `file_attachments`
--

DROP TABLE IF EXISTS `file_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_attachments` (
  `attachment_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint DEFAULT NULL,
  `module_name` varchar(80) NOT NULL,
  `record_id` bigint NOT NULL,
  `file_name` varchar(250) NOT NULL,
  `file_url` text NOT NULL,
  `file_type` varchar(80) DEFAULT NULL,
  `file_size_bytes` bigint DEFAULT NULL,
  `uploaded_by` bigint DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`attachment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_attachments`
--

LOCK TABLES `file_attachments` WRITE;
/*!40000 ALTER TABLE `file_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `file_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fiscal_years`
--

DROP TABLE IF EXISTS `fiscal_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fiscal_years` (
  `fiscal_year_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `year_name` varchar(30) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'OPEN',
  PRIMARY KEY (`fiscal_year_id`),
  UNIQUE KEY `uk_fiscal_years` (`institution_id`,`year_name`),
  CONSTRAINT `chk_fiscal_year_dates` CHECK ((`end_date` >= `start_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fiscal_years`
--

LOCK TABLES `fiscal_years` WRITE;
/*!40000 ALTER TABLE `fiscal_years` DISABLE KEYS */;
/*!40000 ALTER TABLE `fiscal_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grading_scale_details`
--

DROP TABLE IF EXISTS `grading_scale_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grading_scale_details` (
  `grade_detail_id` bigint NOT NULL AUTO_INCREMENT,
  `grading_scale_id` bigint NOT NULL,
  `min_marks` decimal(8,2) NOT NULL,
  `max_marks` decimal(8,2) NOT NULL,
  `letter_grade` varchar(10) NOT NULL,
  `grade_point` decimal(4,2) NOT NULL,
  `remarks` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`grade_detail_id`),
  CONSTRAINT `chk_grade_marks` CHECK ((`max_marks` >= `min_marks`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grading_scale_details`
--

LOCK TABLES `grading_scale_details` WRITE;
/*!40000 ALTER TABLE `grading_scale_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `grading_scale_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grading_scales`
--

DROP TABLE IF EXISTS `grading_scales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grading_scales` (
  `grading_scale_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `scale_name` varchar(100) NOT NULL,
  `max_gpa` decimal(4,2) NOT NULL DEFAULT '5.00',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`grading_scale_id`),
  UNIQUE KEY `uk_grading_scales` (`institution_id`,`scale_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grading_scales`
--

LOCK TABLES `grading_scales` WRITE;
/*!40000 ALTER TABLE `grading_scales` DISABLE KEYS */;
/*!40000 ALTER TABLE `grading_scales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groups` (
  `group_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `group_name` varchar(100) NOT NULL,
  `group_name_bn` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `group_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`group_id`),
  UNIQUE KEY `uk_groups` (`institution_id`,`group_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (6,1,'Science','বিজ্ঞান','ACTIVE','SCI'),(7,1,'Humanities','মানবিক','ACTIVE','HUM'),(8,1,'Business Studies','ব্যবসায় শিক্ষা','ACTIVE','BUS');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guardians`
--

DROP TABLE IF EXISTS `guardians`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guardians` (
  `guardian_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `guardian_name` varchar(150) NOT NULL,
  `relation_name` varchar(50) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `nid_no` varchar(80) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `alternate_mobile` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `monthly_income` decimal(12,2) DEFAULT NULL,
  `address_line` text,
  `photo_url` text,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`guardian_id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guardians`
--

LOCK TABLES `guardians` WRITE;
/*!40000 ALTER TABLE `guardians` DISABLE KEYS */;
INSERT INTO `guardians` VALUES (1,1,NULL,'Ataur Rahman','Father',NULL,NULL,'01665558999988',NULL,NULL,NULL,'Jamalpur',NULL,'ACTIVE','2026-06-11 02:53:41','2026-07-17 23:21:31'),(2,1,NULL,'Ataur Rahman','Father',NULL,NULL,'0125566655','018665588555',NULL,5000.00,NULL,NULL,'ACTIVE','2026-07-17 23:20:53','2026-07-18 02:29:06'),(3,1,NULL,'Ataur Rahman','Father','Teacher','45454545','4545454545',NULL,NULL,NULL,NULL,NULL,'ACTIVE','2026-07-18 03:11:56','2026-07-18 03:26:24');
/*!40000 ALTER TABLE `guardians` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_guardians_updated_at` BEFORE UPDATE ON `guardians` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `holiday_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `holiday_title` varchar(150) NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `holiday_type` varchar(50) DEFAULT NULL,
  `description` text,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`holiday_id`),
  CONSTRAINT `chk_holiday_dates` CHECK ((`to_date` >= `from_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostel_rooms`
--

DROP TABLE IF EXISTS `hostel_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_rooms` (
  `hostel_room_id` bigint NOT NULL AUTO_INCREMENT,
  `hostel_id` bigint NOT NULL,
  `room_no` varchar(50) NOT NULL,
  `capacity` int NOT NULL DEFAULT '1',
  `monthly_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`hostel_room_id`),
  UNIQUE KEY `uk_hostel_rooms` (`hostel_id`,`room_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_rooms`
--

LOCK TABLES `hostel_rooms` WRITE;
/*!40000 ALTER TABLE `hostel_rooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `hostel_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostels`
--

DROP TABLE IF EXISTS `hostels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostels` (
  `hostel_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `hostel_name` varchar(150) NOT NULL,
  `hostel_type` varchar(30) DEFAULT NULL,
  `address_line` text,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`hostel_id`),
  UNIQUE KEY `uk_hostels` (`branch_id`,`hostel_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostels`
--

LOCK TABLES `hostels` WRITE;
/*!40000 ALTER TABLE `hostels` DISABLE KEYS */;
/*!40000 ALTER TABLE `hostels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `institutions`
--

DROP TABLE IF EXISTS `institutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `institutions` (
  `institution_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_code` varchar(30) NOT NULL,
  `institution_name` varchar(200) NOT NULL,
  `institution_name_bn` varchar(200) DEFAULT NULL,
  `short_name_bn` varchar(100) DEFAULT NULL,
  `institution_type` varchar(50) NOT NULL,
  `eiin_no` varchar(50) DEFAULT NULL,
  `registration_no` varchar(80) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `phone_bn` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `website` varchar(150) DEFAULT NULL,
  `logo_url` text,
  `address_line` text,
  `address_line_bn` text,
  `district_bn` varchar(100) DEFAULT NULL,
  `upazila_bn` varchar(100) DEFAULT NULL,
  `post_office_bn` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`institution_id`),
  UNIQUE KEY `institution_code` (`institution_code`),
  CONSTRAINT `chk_institutions_status` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `institutions`
--

LOCK TABLES `institutions` WRITE;
/*!40000 ALTER TABLE `institutions` DISABLE KEYS */;
INSERT INTO `institutions` VALUES (1,'SCH001','PAILA BANIABARI FAZIL MADRASAH','পয়লা বানিয়াবাড়ী ফাজিল মাদরাসা','PBM','Madrasa','562544','1236655','01728838644','০১৭২৮৮৩৮৬৪৪','admin@pbm.com','pbm.shadiqur.com',NULL,NULL,'পয়লা বানিয়াবাড়ী','জামালপুর','মেলান্দহ','মাহমুদপুর','ACTIVE','2026-06-11 01:09:19','2026-07-17 15:13:07');
/*!40000 ALTER TABLE `institutions` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_institutions_updated_at` BEFORE UPDATE ON `institutions` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `item_categories`
--

DROP TABLE IF EXISTS `item_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_categories` (
  `item_category_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `category_name` varchar(120) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`item_category_id`),
  UNIQUE KEY `uk_item_categories` (`institution_id`,`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_categories`
--

LOCK TABLES `item_categories` WRITE;
/*!40000 ALTER TABLE `item_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `item_category_id` bigint DEFAULT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `unit_name` varchar(30) NOT NULL DEFAULT 'PCS',
  `reorder_level` decimal(12,2) DEFAULT '0.00',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `uk_items` (`institution_id`,`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_items_updated_at` BEFORE UPDATE ON `items` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `journal_lines`
--

DROP TABLE IF EXISTS `journal_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_lines` (
  `journal_line_id` bigint NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint NOT NULL,
  `account_id` bigint NOT NULL,
  `debit_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `credit_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `line_description` text,
  `cost_center` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`journal_line_id`),
  CONSTRAINT `chk_journal_line_amount` CHECK ((((`debit_amount` > 0) and (`credit_amount` = 0)) or ((`credit_amount` > 0) and (`debit_amount` = 0))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_lines`
--

LOCK TABLES `journal_lines` WRITE;
/*!40000 ALTER TABLE `journal_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_vouchers`
--

DROP TABLE IF EXISTS `journal_vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_vouchers` (
  `voucher_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `fiscal_year_id` bigint DEFAULT NULL,
  `voucher_no` varchar(50) NOT NULL,
  `voucher_date` date NOT NULL DEFAULT (curdate()),
  `voucher_type` varchar(30) NOT NULL DEFAULT 'JOURNAL',
  `source_module` varchar(50) DEFAULT NULL,
  `source_id` bigint DEFAULT NULL,
  `narration` text,
  `total_debit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_credit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `approval_status` varchar(30) NOT NULL DEFAULT 'DRAFT',
  `created_by` bigint DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`voucher_id`),
  UNIQUE KEY `uk_journal_vouchers` (`institution_id`,`voucher_no`),
  KEY `idx_journal_voucher_date` (`institution_id`,`voucher_date`),
  CONSTRAINT `chk_journal_balance` CHECK ((`total_debit` = `total_credit`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_vouchers`
--

LOCK TABLES `journal_vouchers` WRITE;
/*!40000 ALTER TABLE `journal_vouchers` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_journal_vouchers_updated_at` BEFORE UPDATE ON `journal_vouchers` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `leave_types`
--

DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_types` (
  `leave_type_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `leave_code` varchar(30) NOT NULL,
  `leave_name` varchar(100) NOT NULL,
  `yearly_limit_days` decimal(6,2) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`leave_type_id`),
  UNIQUE KEY `uk_leave_types` (`institution_id`,`leave_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_types`
--

LOCK TABLES `leave_types` WRITE;
/*!40000 ALTER TABLE `leave_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `library_issues`
--

DROP TABLE IF EXISTS `library_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `library_issues` (
  `issue_id` bigint NOT NULL AUTO_INCREMENT,
  `book_copy_id` bigint NOT NULL,
  `member_type` varchar(30) NOT NULL,
  `student_id` bigint DEFAULT NULL,
  `employee_id` bigint DEFAULT NULL,
  `issue_date` date NOT NULL DEFAULT (curdate()),
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `issue_status` varchar(30) NOT NULL DEFAULT 'ISSUED',
  `fine_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `issued_by` bigint DEFAULT NULL,
  `returned_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`issue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `library_issues`
--

LOCK TABLES `library_issues` WRITE;
/*!40000 ALTER TABLE `library_issues` DISABLE KEYS */;
/*!40000 ALTER TABLE `library_issues` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_library_issues_updated_at` BEFORE UPDATE ON `library_issues` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `login_audit`
--

DROP TABLE IF EXISTS `login_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_audit` (
  `login_audit_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `login_status` varchar(20) NOT NULL,
  `failure_reason` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`login_audit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_audit`
--

LOCK TABLES `login_audit` WRITE;
/*!40000 ALTER TABLE `login_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `login_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lookup_types`
--

DROP TABLE IF EXISTS `lookup_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_types` (
  `lookup_type_id` bigint NOT NULL AUTO_INCREMENT,
  `type_code` varchar(50) NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `description` text,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`lookup_type_id`),
  UNIQUE KEY `type_code` (`type_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lookup_types`
--

LOCK TABLES `lookup_types` WRITE;
/*!40000 ALTER TABLE `lookup_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `lookup_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lookup_values`
--

DROP TABLE IF EXISTS `lookup_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_values` (
  `lookup_value_id` bigint NOT NULL AUTO_INCREMENT,
  `lookup_type_id` bigint NOT NULL,
  `value_code` varchar(50) NOT NULL,
  `value_name` varchar(150) NOT NULL,
  `sort_order` int DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`lookup_value_id`),
  UNIQUE KEY `uk_lookup_values` (`lookup_type_id`,`value_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lookup_values`
--

LOCK TABLES `lookup_values` WRITE;
/*!40000 ALTER TABLE `lookup_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `lookup_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mark_components`
--

DROP TABLE IF EXISTS `mark_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mark_components` (
  `component_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `component_code` varchar(30) NOT NULL,
  `component_name` varchar(100) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`component_id`),
  UNIQUE KEY `uk_mark_components` (`institution_id`,`component_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mark_components`
--

LOCK TABLES `mark_components` WRITE;
/*!40000 ALTER TABLE `mark_components` DISABLE KEYS */;
/*!40000 ALTER TABLE `mark_components` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mediums`
--

DROP TABLE IF EXISTS `mediums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mediums` (
  `medium_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint DEFAULT NULL,
  `medium_name` varchar(80) NOT NULL,
  `medium_name_bn` varchar(80) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `medium_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`medium_id`),
  UNIQUE KEY `uk_mediums` (`institution_id`,`medium_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mediums`
--

LOCK TABLES `mediums` WRITE;
/*!40000 ALTER TABLE `mediums` DISABLE KEYS */;
INSERT INTO `mediums` VALUES (6,1,'Bangla Version','বাংলা','ACTIVE','B1'),(7,1,'English Version','ইংরেজী ভার্সন','ACTIVE','E1');
/*!40000 ALTER TABLE `mediums` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menus`
--

DROP TABLE IF EXISTS `menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menus` (
  `menu_id` bigint NOT NULL AUTO_INCREMENT,
  `parent_menu_id` bigint DEFAULT NULL,
  `menu_code` varchar(80) NOT NULL,
  `menu_title` varchar(120) NOT NULL,
  `route_path` varchar(200) DEFAULT NULL,
  `icon_name` varchar(80) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`menu_id`),
  UNIQUE KEY `menu_code` (`menu_code`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menus`
--

LOCK TABLES `menus` WRITE;
/*!40000 ALTER TABLE `menus` DISABLE KEYS */;
INSERT INTO `menus` VALUES (1,NULL,'DASHBOARD','Dashboard','/dashboard','LayoutDashboard',1,1,'ACTIVE'),(2,NULL,'STUDENT','Student Management',NULL,'GraduationCap',10,1,'ACTIVE'),(3,NULL,'SECURITY','Security Setup',NULL,'ShieldCheck',90,1,'ACTIVE'),(7,2,'STUDENT_ADMISSION','Student Admission','/students/admission','UserPlus',1,1,'ACTIVE'),(8,2,'STUDENT_LIST','Student List','/students','Users',2,1,'ACTIVE'),(9,3,'USER_LIST','Users','/users','UsersRound',1,1,'ACTIVE'),(10,3,'ROLE_LIST','Roles','/security/roles','UserCog',2,1,'ACTIVE'),(11,3,'ROLE_PERMISSION','Role Permissions','/security/role-permissions','LockKeyhole',3,1,'ACTIVE'),(13,3,'institutions','Institutions','/institutions',NULL,0,1,'ACTIVE'),(14,3,'menus','Menu Setup','/security/menus',NULL,4,1,'ACTIVE'),(15,NULL,'master-data','Master Data Setup','/master-data',NULL,2,1,'ACTIVE'),(26,NULL,'EMPLOYEE_MANAGEMENT','Employee Management','/employees','employee',40,1,'ACTIVE'),(91,NULL,'NOTICE_MANAGEMENT','Notice Management','/notices','notice',45,1,'ACTIVE');
/*!40000 ALTER TABLE `menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notice_categories`
--

DROP TABLE IF EXISTS `notice_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notice_categories` (
  `notice_category_id` bigint NOT NULL AUTO_INCREMENT,
  `category_code` varchar(40) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `category_name_bn` varchar(100) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`notice_category_id`),
  UNIQUE KEY `category_code` (`category_code`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notice_categories`
--

LOCK TABLES `notice_categories` WRITE;
/*!40000 ALTER TABLE `notice_categories` DISABLE KEYS */;
INSERT INTO `notice_categories` VALUES (1,'GENERAL','General','সাধারণ',10,'ACTIVE','2026-07-18 20:29:08','2026-07-18 20:29:08'),(2,'ADMISSION','Admission','ভর্তি',20,'ACTIVE','2026-07-18 20:29:08','2026-07-18 20:29:08'),(3,'EXAMINATION','Examination','পরীক্ষা',30,'ACTIVE','2026-07-18 20:29:08','2026-07-18 20:29:08'),(4,'ADMINISTRATION','Administration','প্রশাসন',40,'ACTIVE','2026-07-18 20:29:08','2026-07-18 20:29:08');
/*!40000 ALTER TABLE `notice_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notices` (
  `notice_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `notice_title` varchar(200) NOT NULL,
  `notice_body` text NOT NULL,
  `audience_type` varchar(50) NOT NULL DEFAULT 'ALL',
  `publish_date` date NOT NULL DEFAULT (curdate()),
  `expire_date` date DEFAULT NULL,
  `attachment_url` text,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `category_code` varchar(40) NOT NULL DEFAULT 'GENERAL',
  `title` varchar(255) DEFAULT NULL,
  `title_bn` varchar(255) DEFAULT NULL,
  `description` text,
  `is_urgent` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'DRAFT',
  `published_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `content_html` text,
  PRIMARY KEY (`notice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notices`
--

LOCK TABLES `notices` WRITE;
/*!40000 ALTER TABLE `notices` DISABLE KEYS */;
INSERT INTO `notices` VALUES (1,1,NULL,'২০২৬ শিক্ষাবর্ষে ভর্তি বিজ্ঞপ্তি','২০২৬ শিক্ষাবর্ষে ১ম থেকে দ্বাদশ শ্রেণি পর্যন্ত ভর্তি কার্যক্রম শুরু হবে। ভর্তি পোর্টালর মাধ্যমে অনলাইনে আবেদন করতে হবে। বিস্তারিত বাংলাদেশ মাদরাসা শিক্ষা বোর্ডের ওয়েবসাইটে পাওয়া যাবে।','ALL','2026-07-18',NULL,NULL,1,2,'2026-07-18 20:37:20','2026-07-18 21:46:57','ADMISSION','২০২৬ শিক্ষাবর্ষে ভর্তি বিজ্ঞপ্তি',NULL,'২০২৬ শিক্ষাবর্ষে ১ম থেকে দ্বাদশ শ্রেণি পর্যন্ত ভর্তি কার্যক্রম শুরু হবে। ভর্তি পোর্টালর মাধ্যমে অনলাইনে আবেদন করতে হবে। বিস্তারিত বাংলাদেশ মাদরাসা শিক্ষা বোর্ডের ওয়েবসাইটে পাওয়া যাবে।',0,'PUBLISHED','2026-07-18 14:36:00',NULL,2,NULL),(2,1,NULL,'নতুন শিক্ষাবর্ষে ভর্তি বিজ্ঞপ্তি','ভর্তি বিজ্ঞপ্তি – ২০২৬এতদ্বারা সংশ্লিষ্ট সকলের অবগতির জন্য জানানো যাচ্ছে যে, আদর্শ শিক্ষা প্রতিষ্ঠান-এ ২০২৬ শিক্ষাবর্ষে প্লে থেকে নবম শ্রেণি পর্যন্ত শিক্ষার্থী ভর্তি কার্যক্রম শুরু হয়েছে।আবেদনসংক্রান্ত তথ্যআবেদন শুরু: ২০ জুলাই ২০২৬আবেদনের শেষ তারিখ: ২০ আগস্ট ২০২৬ভর্তি পরীক্ষা: ২৫ আগস্ট ২০২৬ফলাফল প্রকাশ: ২৮ আগস্ট ২০২৬ক্লাস শুরু: ১ সেপ্টেম্বর ২০২৬আবেদন ফি: ৫০০ টাকাআবেদনের যোগ্যতা১. আবেদনকারীকে পূর্ববর্তী শ্রেণিতে উত্তীর্ণ হতে হবে।২. শিক্ষার্থীর বয়স সংশ্লিষ্ট শ্রেণির জন্য নির্ধারিত বয়সসীমার মধ্যে হতে হবে।৩. অসম্পূর্ণ বা ভুল তথ্যসংবলিত আবেদন গ্রহণ করা হবে না।৪. ভর্তি পরীক্ষায় উত্তীর্ণ শিক্ষার্থীদের মেধাক্রম অনুসারে ভর্তি করা হবে।প্রয়োজনীয় কাগজপত্রশিক্ষার্থীর জন্মনিবন্ধন সনদের ফটোকপিসদ্য তোলা দুই কপি পাসপোর্ট সাইজের রঙিন ছবিপিতা ও মাতার জাতীয় পরিচয়পত্রের ফটোকপিপূর্ববর্তী প্রতিষ্ঠানের ছাড়পত্র বা প্রশংসাপত্রসর্বশেষ পরীক্ষার ফলাফলের কপিরক্তের গ্রুপের সনদ, প্রযোজ্য ক্ষেত্রেআবেদন পদ্ধতিআগ্রহী শিক্ষার্থী ও অভিভাবকরা প্রতিষ্ঠানের অফিস থেকে ভর্তি ফরম সংগ্রহ করতে পারবেন অথবা প্রতিষ্ঠানের ওয়েবসাইটে অনলাইনে আবেদন করতে পারবেন।বিশেষ সুবিধাঅভিজ্ঞ ও প্রশিক্ষিত শিক্ষক-শিক্ষিকাআধুনিক ও মাল্টিমিডিয়া শ্রেণিকক্ষবিজ্ঞান ও কম্পিউটার ল্যাবসমৃদ্ধ লাইব্রেরিনিয়মিত পরীক্ষা ও ফলাফল পর্যবেক্ষণনিরাপদ ও শৃঙ্খলাপূর্ণ শিক্ষার পরিবেশমেধাবী ও অসচ্ছল শিক্ষার্থীদের জন্য বিশেষ বৃত্তিআসনসংখ্যা সীমিত। তাই নির্ধারিত সময়ের মধ্যে আবেদন সম্পন্ন করার জন্য শিক্ষার্থী ও অভিভাবকদের অনুরোধ করা যাচ্ছে।আদেশক্রমেঅধ্যক্ষ/প্রধান শিক্ষক','ALL','2026-07-18',NULL,'/uploads/notices/notice-1784387089671-AdmitCard-1297895.pdf',1,2,'2026-07-18 20:40:12','2026-07-18 21:57:18','ADMISSION','নতুন শিক্ষাবর্ষে ভর্তি বিজ্ঞপ্তি',NULL,'ভর্তি বিজ্ঞপ্তি – ২০২৬এতদ্বারা সংশ্লিষ্ট সকলের অবগতির জন্য জানানো যাচ্ছে যে, আদর্শ শিক্ষা প্রতিষ্ঠান-এ ২০২৬ শিক্ষাবর্ষে প্লে থেকে নবম শ্রেণি পর্যন্ত শিক্ষার্থী ভর্তি কার্যক্রম শুরু হয়েছে।আবেদনসংক্রান্ত তথ্যআবেদন শুরু: ২০ জুলাই ২০২৬আবেদনের শেষ তারিখ: ২০ আগস্ট ২০২৬ভর্তি পরীক্ষা: ২৫ আগস্ট ২০২৬ফলাফল প্রকাশ: ২৮ আগস্ট ২০২৬ক্লাস শুরু: ১ সেপ্টেম্বর ২০২৬আবেদন ফি: ৫০০ টাকাআবেদনের যোগ্যতা১. আবেদনকারীকে পূর্ববর্তী শ্রেণিতে উত্তীর্ণ হতে হবে।২. শিক্ষার্থীর বয়স সংশ্লিষ্ট শ্রেণির জন্য নির্ধারিত বয়সসীমার মধ্যে হতে হবে।৩. অসম্পূর্ণ বা ভুল তথ্যসংবলিত আবেদন গ্রহণ করা হবে না।৪. ভর্তি পরীক্ষায় উত্তীর্ণ শিক্ষার্থীদের মেধাক্রম অনুসারে ভর্তি করা হবে।প্রয়োজনীয় কাগজপত্রশিক্ষার্থীর জন্মনিবন্ধন সনদের ফটোকপিসদ্য তোলা দুই কপি পাসপোর্ট সাইজের রঙিন ছবিপিতা ও মাতার জাতীয় পরিচয়পত্রের ফটোকপিপূর্ববর্তী প্রতিষ্ঠানের ছাড়পত্র বা প্রশংসাপত্রসর্বশেষ পরীক্ষার ফলাফলের কপিরক্তের গ্রুপের সনদ, প্রযোজ্য ক্ষেত্রেআবেদন পদ্ধতিআগ্রহী শিক্ষার্থী ও অভিভাবকরা প্রতিষ্ঠানের অফিস থেকে ভর্তি ফরম সংগ্রহ করতে পারবেন অথবা প্রতিষ্ঠানের ওয়েবসাইটে অনলাইনে আবেদন করতে পারবেন।বিশেষ সুবিধাঅভিজ্ঞ ও প্রশিক্ষিত শিক্ষক-শিক্ষিকাআধুনিক ও মাল্টিমিডিয়া শ্রেণিকক্ষবিজ্ঞান ও কম্পিউটার ল্যাবসমৃদ্ধ লাইব্রেরিনিয়মিত পরীক্ষা ও ফলাফল পর্যবেক্ষণনিরাপদ ও শৃঙ্খলাপূর্ণ শিক্ষার পরিবেশমেধাবী ও অসচ্ছল শিক্ষার্থীদের জন্য বিশেষ বৃত্তিআসনসংখ্যা সীমিত। তাই নির্ধারিত সময়ের মধ্যে আবেদন সম্পন্ন করার জন্য শিক্ষার্থী ও অভিভাবকদের অনুরোধ করা যাচ্ছে।আদেশক্রমেঅধ্যক্ষ/প্রধান শিক্ষক',1,'PUBLISHED','2026-07-18 14:38:00',NULL,2,'<h2>ভর্তি বিজ্ঞপ্তি – ২০২৬</h2><p>এতদ্বারা সংশ্লিষ্ট সকলের অবগতির জন্য জানানো যাচ্ছে যে, <strong>আদর্শ শিক্ষা প্রতিষ্ঠান</strong>-এ ২০২৬ শিক্ষাবর্ষে <strong>প্লে থেকে নবম শ্রেণি পর্যন্ত</strong> শিক্ষার্থী ভর্তি কার্যক্রম শুরু হয়েছে।</p><h3>আবেদনসংক্রান্ত তথ্য</h3><ul><li><p><strong>আবেদন শুরু:</strong> ২০ জুলাই ২০২৬</p></li><li><p><strong>আবেদনের শেষ তারিখ:</strong> ২০ আগস্ট ২০২৬</p></li><li><p><strong>ভর্তি পরীক্ষা:</strong> ২৫ আগস্ট ২০২৬</p></li><li><p><strong>ফলাফল প্রকাশ:</strong> ২৮ আগস্ট ২০২৬</p></li><li><p><strong>ক্লাস শুরু:</strong> ১ সেপ্টেম্বর ২০২৬</p></li><li><p><strong>আবেদন ফি:</strong> ৫০০ টাকা</p></li></ul><h3>আবেদনের যোগ্যতা</h3><p>১. আবেদনকারীকে পূর্ববর্তী শ্রেণিতে উত্তীর্ণ হতে হবে।<br />২. শিক্ষার্থীর বয়স সংশ্লিষ্ট শ্রেণির জন্য নির্ধারিত বয়সসীমার মধ্যে হতে হবে।<br />৩. অসম্পূর্ণ বা ভুল তথ্যসংবলিত আবেদন গ্রহণ করা হবে না।<br />৪. ভর্তি পরীক্ষায় উত্তীর্ণ শিক্ষার্থীদের মেধাক্রম অনুসারে ভর্তি করা হবে।</p><h3>প্রয়োজনীয় কাগজপত্র</h3><ul><li><p>শিক্ষার্থীর জন্মনিবন্ধন সনদের ফটোকপি</p></li><li><p>সদ্য তোলা দুই কপি পাসপোর্ট সাইজের রঙিন ছবি</p></li><li><p>পিতা ও মাতার জাতীয় পরিচয়পত্রের ফটোকপি</p></li><li><p>পূর্ববর্তী প্রতিষ্ঠানের ছাড়পত্র বা প্রশংসাপত্র</p></li><li><p>সর্বশেষ পরীক্ষার ফলাফলের কপি</p></li><li><p>রক্তের গ্রুপের সনদ, প্রযোজ্য ক্ষেত্রে</p></li></ul><h3>আবেদন পদ্ধতি</h3><p>আগ্রহী শিক্ষার্থী ও অভিভাবকরা প্রতিষ্ঠানের অফিস থেকে ভর্তি ফরম সংগ্রহ করতে পারবেন অথবা প্রতিষ্ঠানের ওয়েবসাইটে অনলাইনে আবেদন করতে পারবেন।</p><h3>বিশেষ সুবিধা</h3><ul><li><p>অভিজ্ঞ ও প্রশিক্ষিত শিক্ষক-শিক্ষিকা</p></li><li><p>আধুনিক ও মাল্টিমিডিয়া শ্রেণিকক্ষ</p></li><li><p>বিজ্ঞান ও কম্পিউটার ল্যাব</p></li><li><p>সমৃদ্ধ লাইব্রেরি</p></li><li><p>নিয়মিত পরীক্ষা ও ফলাফল পর্যবেক্ষণ</p></li><li><p>নিরাপদ ও শৃঙ্খলাপূর্ণ শিক্ষার পরিবেশ</p></li><li><p>মেধাবী ও অসচ্ছল শিক্ষার্থীদের জন্য বিশেষ বৃত্তি</p></li></ul><p>আসনসংখ্যা সীমিত। তাই নির্ধারিত সময়ের মধ্যে আবেদন সম্পন্ন করার জন্য শিক্ষার্থী ও অভিভাবকদের অনুরোধ করা যাচ্ছে।</p><p><strong>আদেশক্রমে</strong><br />অধ্যক্ষ/প্রধান শিক্ষক</p>');
/*!40000 ALTER TABLE `notices` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_notices_updated_at` BEFORE UPDATE ON `notices` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `notification_logs`
--

DROP TABLE IF EXISTS `notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_logs` (
  `notification_log_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint DEFAULT NULL,
  `template_id` bigint DEFAULT NULL,
  `channel` varchar(30) NOT NULL,
  `recipient_type` varchar(30) DEFAULT NULL,
  `recipient_id` bigint DEFAULT NULL,
  `recipient_address` varchar(200) DEFAULT NULL,
  `subject_text` varchar(250) DEFAULT NULL,
  `body_text` text,
  `send_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `error_message` text,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_log_id`),
  KEY `idx_notification_logs_status` (`send_status`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_logs`
--

LOCK TABLES `notification_logs` WRITE;
/*!40000 ALTER TABLE `notification_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_templates`
--

DROP TABLE IF EXISTS `notification_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_templates` (
  `template_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint DEFAULT NULL,
  `template_code` varchar(80) NOT NULL,
  `template_name` varchar(150) NOT NULL,
  `channel` varchar(30) NOT NULL,
  `subject_template` varchar(250) DEFAULT NULL,
  `body_template` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`template_id`),
  UNIQUE KEY `uk_notification_templates` (`institution_id`,`template_code`,`channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_templates`
--

LOCK TABLES `notification_templates` WRITE;
/*!40000 ALTER TABLE `notification_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `token_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `permission_id` bigint NOT NULL AUTO_INCREMENT,
  `permission_code` varchar(100) NOT NULL,
  `permission_name` varchar(150) NOT NULL,
  `module_name` varchar(80) NOT NULL,
  `description` text,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `permission_code` (`permission_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1212 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'dashboard.access','Dashboard Access','Dashboard','Open the dashboard','ACTIVE'),(2,'institution.management','Institution Management','Administration','Manage institutions','ACTIVE'),(3,'master-data.management','Master Data Management','Administration','Manage academic and branch setup','ACTIVE'),(4,'student.management','Student Management','Students','View student records','ACTIVE'),(5,'student.admission','Student Admission','Students','Admit new students','ACTIVE'),(6,'user.management','User Management','Security','Manage application users','ACTIVE'),(7,'role.management','Role Management','Security','Manage security roles','ACTIVE'),(8,'role.permission','Role Permissions','Security','Assign permissions to roles','ACTIVE'),(9,'menu.management','Menu Management','Security','Manage sidebar menus','ACTIVE'),(10,'menu.permission','Menu Permissions','Security','Assign sidebar menu access','ACTIVE'),(11,'user.role','User Role Assignment','Security','Assign roles to users','ACTIVE'),(182,'employee.management','Employee Management','HR','Manage departments, designations, and employees','ACTIVE'),(1023,'notice.management','Notice Management','Notices','Create and publish categorized notices','ACTIVE');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion_details`
--

DROP TABLE IF EXISTS `promotion_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion_details` (
  `promotion_detail_id` bigint NOT NULL AUTO_INCREMENT,
  `promotion_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `from_enrollment_id` bigint DEFAULT NULL,
  `to_batch_id` bigint DEFAULT NULL,
  `to_roll_no` varchar(30) DEFAULT NULL,
  `result_status` varchar(30) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`promotion_detail_id`),
  UNIQUE KEY `uk_promotion_student` (`promotion_id`,`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion_details`
--

LOCK TABLES `promotion_details` WRITE;
/*!40000 ALTER TABLE `promotion_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotion_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `promotion_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `from_academic_year_id` bigint NOT NULL,
  `to_academic_year_id` bigint NOT NULL,
  `promotion_date` date NOT NULL DEFAULT (curdate()),
  `promotion_status` varchar(30) NOT NULL DEFAULT 'DRAFT',
  `remarks` text,
  `created_by` bigint DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`promotion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_promotions_updated_at` BEFORE UPDATE ON `promotions` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `purchase_order_lines`
--

DROP TABLE IF EXISTS `purchase_order_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_lines` (
  `po_line_id` bigint NOT NULL AUTO_INCREMENT,
  `po_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rate` decimal(12,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `remarks` text,
  PRIMARY KEY (`po_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_lines`
--

LOCK TABLES `purchase_order_lines` WRITE;
/*!40000 ALTER TABLE `purchase_order_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_order_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `po_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `vendor_id` bigint DEFAULT NULL,
  `po_no` varchar(50) NOT NULL,
  `po_date` date NOT NULL DEFAULT (curdate()),
  `expected_date` date DEFAULT NULL,
  `total_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `po_status` varchar(30) NOT NULL DEFAULT 'DRAFT',
  `created_by` bigint DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`po_id`),
  UNIQUE KEY `uk_purchase_orders` (`branch_id`,`po_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_purchase_orders_updated_at` BEFORE UPDATE ON `purchase_orders` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `role_menus`
--

DROP TABLE IF EXISTS `role_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_menus` (
  `role_id` bigint NOT NULL,
  `menu_id` bigint NOT NULL,
  `can_access` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`role_id`,`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_menus`
--

LOCK TABLES `role_menus` WRITE;
/*!40000 ALTER TABLE `role_menus` DISABLE KEYS */;
INSERT INTO `role_menus` VALUES (1,1,1),(1,2,1),(1,3,1),(1,7,1),(1,8,1),(1,9,1),(1,10,1),(1,11,1),(1,13,1),(1,14,1),(1,15,1),(1,17,1),(1,18,1),(1,19,1),(1,25,1),(1,26,1),(1,91,1),(2,1,1),(2,2,1),(2,8,1),(3,1,1),(3,2,1),(3,3,1),(3,7,1),(3,8,1),(3,9,1),(3,10,1),(3,11,1),(3,13,1),(3,14,1),(3,15,1),(3,25,1),(4,1,1),(4,2,1),(4,8,1);
/*!40000 ALTER TABLE `role_menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  `can_view` tinyint(1) NOT NULL DEFAULT '1',
  `can_create` tinyint(1) NOT NULL DEFAULT '0',
  `can_update` tinyint(1) NOT NULL DEFAULT '0',
  `can_delete` tinyint(1) NOT NULL DEFAULT '0',
  `can_approve` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`,`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1,0,0,0,0,'2026-06-11 02:10:04'),(1,2,1,1,1,0,1,'2026-06-11 02:10:04'),(1,3,1,1,1,0,1,'2026-06-11 02:10:04'),(1,4,1,1,1,0,1,'2026-06-11 02:10:04'),(1,5,1,1,1,0,1,'2026-06-11 02:10:04'),(1,6,1,1,1,1,0,'2026-06-11 02:10:04'),(1,7,1,1,1,1,0,'2026-06-11 02:10:04'),(1,8,1,0,1,0,0,'2026-06-11 02:10:04'),(1,9,1,1,1,1,0,'2026-06-11 02:10:04'),(1,10,1,0,1,0,0,'2026-06-11 02:10:04'),(1,11,1,0,1,1,0,'2026-06-11 02:10:04'),(1,182,1,1,1,1,1,'2026-07-18 00:02:51'),(1,1023,1,1,1,1,1,'2026-07-18 20:29:08'),(2,1,1,0,0,0,0,'2026-06-11 01:46:28'),(2,4,1,0,0,0,0,'2026-06-11 01:46:28'),(3,1,1,1,1,1,1,'2026-07-18 13:08:39'),(3,2,1,1,1,1,1,'2026-07-18 13:08:39'),(3,3,1,1,1,1,1,'2026-07-18 13:08:39'),(3,4,1,1,1,1,1,'2026-07-18 13:08:39'),(3,5,1,1,1,1,1,'2026-07-18 13:08:39'),(3,6,1,1,1,1,1,'2026-07-18 13:08:39'),(3,7,1,1,1,1,1,'2026-07-18 13:08:39'),(3,8,1,1,1,1,1,'2026-07-18 13:08:39'),(3,9,1,1,1,1,1,'2026-07-18 13:08:39'),(3,10,1,1,1,1,1,'2026-07-18 13:08:39'),(3,11,1,1,1,1,1,'2026-07-18 13:08:39'),(3,182,1,1,1,1,1,'2026-07-18 13:08:39'),(4,1,1,0,0,0,0,'2026-06-11 02:17:50'),(4,4,1,0,0,0,0,'2026-06-11 02:17:50');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint DEFAULT NULL,
  `role_code` varchar(50) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `description` text,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_roles` (`institution_id`,`role_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,1,'ADMIN','Administrators',NULL,0,'ACTIVE','2026-06-11 01:09:57','2026-06-11 01:09:57'),(3,1,'SUPER_ADMIN','Super Admin',NULL,0,'ACTIVE','2026-06-11 02:11:22','2026-06-11 02:11:22'),(4,1,'STAFF','Staff',NULL,0,'ACTIVE','2026-06-11 02:14:29','2026-06-11 02:14:29');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_roles_updated_at` BEFORE UPDATE ON `roles` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `sections`
--

DROP TABLE IF EXISTS `sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sections` (
  `section_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `section_name` varchar(50) NOT NULL,
  `section_name_bn` varchar(50) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `section_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`section_id`),
  UNIQUE KEY `uk_sections` (`institution_id`,`section_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sections`
--

LOCK TABLES `sections` WRITE;
/*!40000 ALTER TABLE `sections` DISABLE KEYS */;
INSERT INTO `sections` VALUES (6,1,'Section A','ক',40,'ACTIVE','SEC-A'),(7,1,'Section B','খ',40,'ACTIVE','SEC-B');
/*!40000 ALTER TABLE `sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `shift_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `shift_name` varchar(80) NOT NULL,
  `shift_name_bn` varchar(80) DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`shift_id`),
  UNIQUE KEY `uk_shifts` (`institution_id`,`shift_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` VALUES (3,1,'Morning','মর্নিং','07:00:00','12:00:00','ACTIVE'),(4,1,'Day ','ডে','12:15:00','17:15:00','ACTIVE');
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_locations`
--

DROP TABLE IF EXISTS `stock_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_locations` (
  `location_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `location_code` varchar(30) NOT NULL,
  `location_name` varchar(120) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`location_id`),
  UNIQUE KEY `uk_stock_locations` (`branch_id`,`location_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_locations`
--

LOCK TABLES `stock_locations` WRITE;
/*!40000 ALTER TABLE `stock_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transactions`
--

DROP TABLE IF EXISTS `stock_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transactions` (
  `stock_transaction_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `location_id` bigint DEFAULT NULL,
  `item_id` bigint NOT NULL,
  `transaction_date` date NOT NULL DEFAULT (curdate()),
  `transaction_type` varchar(30) NOT NULL,
  `source_module` varchar(50) DEFAULT NULL,
  `source_id` bigint DEFAULT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `rate` decimal(12,2) DEFAULT '0.00',
  `amount` decimal(14,2) DEFAULT '0.00',
  `remarks` text,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`stock_transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transactions`
--

LOCK TABLES `stock_transactions` WRITE;
/*!40000 ALTER TABLE `stock_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_addresses`
--

DROP TABLE IF EXISTS `student_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_addresses` (
  `address_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `address_type` varchar(30) NOT NULL,
  `village_road` varchar(200) DEFAULT NULL,
  `post_office` varchar(120) DEFAULT NULL,
  `thana_upazila` varchar(120) DEFAULT NULL,
  `district` varchar(120) DEFAULT NULL,
  `division` varchar(120) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(80) DEFAULT 'Bangladesh',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  UNIQUE KEY `uk_student_addresses` (`student_id`,`address_type`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_addresses`
--

LOCK TABLES `student_addresses` WRITE;
/*!40000 ALTER TABLE `student_addresses` DISABLE KEYS */;
INSERT INTO `student_addresses` VALUES (1,1,'PRESENT','Baniabari','Mahmudpur','Melandaha','Jamalpur','Mymensingh','2013','Bangladesh','2026-06-11 02:53:41','2026-07-17 23:21:31'),(2,1,'PERMANENT','Baniabari','Mahmudpur','Melandaha','Jamalpur','Mymensingh','2013','Bangladesh','2026-06-11 02:53:41','2026-07-17 23:21:31'),(5,2,'PRESENT','Baniabari','Mahmudpur','Melandaha','Jamalpur','Mymensingh','2013','Bangladesh','2026-07-17 23:20:53','2026-07-18 02:29:06'),(6,2,'PERMANENT','Baniabari','Mahmudpur','Melandaha','Jamalpur','Mymensingh','2013','Bangladesh','2026-07-17 23:20:53','2026-07-18 02:29:06'),(15,3,'PRESENT','baniabari','Mahmudpur','melandaha','jamalpur','Mymensingh','2013','Bangladesh','2026-07-18 03:11:56','2026-07-18 03:26:24'),(16,3,'PERMANENT','baniabari','Mahmudpur','melandaha','jamalpur','Mymensingh','2013','Bangladesh','2026-07-18 03:11:56','2026-07-18 03:26:24');
/*!40000 ALTER TABLE `student_addresses` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_student_addresses_updated_at` BEFORE UPDATE ON `student_addresses` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `student_admissions`
--

DROP TABLE IF EXISTS `student_admissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_admissions` (
  `admission_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `branch_id` bigint NOT NULL,
  `academic_year_id` bigint NOT NULL,
  `admission_date` date NOT NULL DEFAULT (curdate()),
  `admission_type` varchar(30) DEFAULT 'NEW',
  `previous_institute` varchar(200) DEFAULT NULL,
  `previous_class` varchar(100) DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `approval_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `remarks` text,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`admission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_admissions`
--

LOCK TABLES `student_admissions` WRITE;
/*!40000 ALTER TABLE `student_admissions` DISABLE KEYS */;
INSERT INTO `student_admissions` VALUES (1,1,1,1,'2026-06-09','NEW',NULL,NULL,NULL,'PENDING',NULL,NULL,'2026-06-11 02:53:41','2026-07-17 23:21:31'),(2,2,3,3,'2026-07-17','NEW',NULL,NULL,NULL,'PENDING',NULL,NULL,'2026-07-17 23:20:53','2026-07-18 02:29:06'),(3,3,3,3,'2026-07-18','NEW','rrr','rr',NULL,'PENDING',NULL,NULL,'2026-07-18 03:11:56','2026-07-18 03:26:24');
/*!40000 ALTER TABLE `student_admissions` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_student_admissions_updated_at` BEFORE UPDATE ON `student_admissions` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `student_attendance`
--

DROP TABLE IF EXISTS `student_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_attendance` (
  `attendance_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `enrollment_id` bigint DEFAULT NULL,
  `branch_id` bigint NOT NULL,
  `attendance_date` date NOT NULL,
  `in_time` time DEFAULT NULL,
  `out_time` time DEFAULT NULL,
  `attendance_status` varchar(30) NOT NULL DEFAULT 'PRESENT',
  `device_id` bigint DEFAULT NULL,
  `remarks` text,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uk_student_attendance` (`student_id`,`attendance_date`),
  KEY `idx_student_attendance_date` (`branch_id`,`attendance_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_attendance`
--

LOCK TABLES `student_attendance` WRITE;
/*!40000 ALTER TABLE `student_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_attendance` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_student_attendance_updated_at` BEFORE UPDATE ON `student_attendance` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `student_documents`
--

DROP TABLE IF EXISTS `student_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_documents` (
  `document_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `document_type` varchar(80) NOT NULL,
  `document_title` varchar(150) DEFAULT NULL,
  `file_url` text NOT NULL,
  `uploaded_by` bigint DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`document_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_documents`
--

LOCK TABLES `student_documents` WRITE;
/*!40000 ALTER TABLE `student_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_enrollments`
--

DROP TABLE IF EXISTS `student_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_enrollments` (
  `enrollment_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `branch_id` bigint NOT NULL,
  `academic_year_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `roll_no` varchar(30) DEFAULT NULL,
  `class_id` bigint NOT NULL,
  `group_id` bigint DEFAULT NULL,
  `section_id` bigint DEFAULT NULL,
  `medium_id` bigint DEFAULT NULL,
  `shift_id` bigint DEFAULT NULL,
  `enrollment_status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `start_date` date NOT NULL DEFAULT (curdate()),
  `end_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`enrollment_id`),
  UNIQUE KEY `uk_student_year` (`student_id`,`academic_year_id`),
  UNIQUE KEY `uk_batch_roll` (`batch_id`,`roll_no`),
  KEY `idx_student_enrollments_student` (`student_id`),
  KEY `idx_student_enrollments_batch` (`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_enrollments`
--

LOCK TABLES `student_enrollments` WRITE;
/*!40000 ALTER TABLE `student_enrollments` DISABLE KEYS */;
INSERT INTO `student_enrollments` VALUES (1,1,1,1,1,'01',1,4,4,4,1,'ACTIVE','2026-06-09','2026-12-30','2026-06-11 02:53:41','2026-07-17 23:21:31'),(3,2,3,3,1,'10001',14,7,6,6,4,'ACTIVE','2026-07-17',NULL,'2026-07-17 23:20:53','2026-07-18 02:29:06'),(8,3,3,3,1,'4',14,7,6,6,4,'ACTIVE','2026-07-18',NULL,'2026-07-18 03:11:56','2026-07-18 03:26:24');
/*!40000 ALTER TABLE `student_enrollments` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_student_enrollments_updated_at` BEFORE UPDATE ON `student_enrollments` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `student_fee_assignments`
--

DROP TABLE IF EXISTS `student_fee_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_fee_assignments` (
  `assignment_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `enrollment_id` bigint NOT NULL,
  `fee_structure_id` bigint NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `discount_amount` decimal(12,2) DEFAULT '0.00',
  `reason` text,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `assigned_by` bigint DEFAULT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `uk_student_fee_assignment` (`student_id`,`enrollment_id`,`fee_structure_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_fee_assignments`
--

LOCK TABLES `student_fee_assignments` WRITE;
/*!40000 ALTER TABLE `student_fee_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_fee_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_guardians`
--

DROP TABLE IF EXISTS `student_guardians`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_guardians` (
  `student_guardian_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `guardian_id` bigint NOT NULL,
  `relation_type` varchar(50) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_emergency_contact` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_guardian_id`),
  UNIQUE KEY `uk_student_guardians` (`student_id`,`guardian_id`,`relation_type`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_guardians`
--

LOCK TABLES `student_guardians` WRITE;
/*!40000 ALTER TABLE `student_guardians` DISABLE KEYS */;
INSERT INTO `student_guardians` VALUES (5,1,1,'FATHER',1,0,'2026-07-17 23:21:31'),(7,2,2,'FATHER',1,1,'2026-07-18 02:29:06'),(14,3,3,'FATHER',1,1,'2026-07-18 03:26:24');
/*!40000 ALTER TABLE `student_guardians` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_hostel_assignments`
--

DROP TABLE IF EXISTS `student_hostel_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_hostel_assignments` (
  `hostel_assignment_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `hostel_room_id` bigint NOT NULL,
  `start_date` date NOT NULL DEFAULT (curdate()),
  `end_date` date DEFAULT NULL,
  `monthly_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`hostel_assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_hostel_assignments`
--

LOCK TABLES `student_hostel_assignments` WRITE;
/*!40000 ALTER TABLE `student_hostel_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_hostel_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_result_details`
--

DROP TABLE IF EXISTS `student_result_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_result_details` (
  `result_detail_id` bigint NOT NULL AUTO_INCREMENT,
  `result_id` bigint NOT NULL,
  `subject_id` bigint NOT NULL,
  `full_marks` decimal(8,2) NOT NULL DEFAULT '100.00',
  `pass_marks` decimal(8,2) NOT NULL DEFAULT '33.00',
  `obtained_marks` decimal(8,2) NOT NULL DEFAULT '0.00',
  `letter_grade` varchar(10) DEFAULT NULL,
  `grade_point` decimal(4,2) DEFAULT NULL,
  `subject_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `remarks` text,
  PRIMARY KEY (`result_detail_id`),
  UNIQUE KEY `uk_student_result_details` (`result_id`,`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_result_details`
--

LOCK TABLES `student_result_details` WRITE;
/*!40000 ALTER TABLE `student_result_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_result_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_results`
--

DROP TABLE IF EXISTS `student_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_results` (
  `result_id` bigint NOT NULL AUTO_INCREMENT,
  `exam_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `enrollment_id` bigint DEFAULT NULL,
  `total_marks` decimal(10,2) NOT NULL DEFAULT '0.00',
  `obtained_marks` decimal(10,2) NOT NULL DEFAULT '0.00',
  `gpa` decimal(4,2) DEFAULT NULL,
  `letter_grade` varchar(10) DEFAULT NULL,
  `merit_position` int DEFAULT NULL,
  `result_status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `failed_subject_count` int NOT NULL DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`result_id`),
  UNIQUE KEY `uk_student_results` (`exam_id`,`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_results`
--

LOCK TABLES `student_results` WRITE;
/*!40000 ALTER TABLE `student_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_results` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_student_results_updated_at` BEFORE UPDATE ON `student_results` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `student_status_history`
--

DROP TABLE IF EXISTS `student_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_status_history` (
  `status_history_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `old_status` varchar(30) DEFAULT NULL,
  `new_status` varchar(30) NOT NULL,
  `effective_date` date NOT NULL DEFAULT (curdate()),
  `reason` text,
  `changed_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`status_history_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_status_history`
--

LOCK TABLES `student_status_history` WRITE;
/*!40000 ALTER TABLE `student_status_history` DISABLE KEYS */;
INSERT INTO `student_status_history` VALUES (1,1,NULL,'ACTIVE','2026-06-11','Student admission created',NULL,'2026-06-11 02:53:41'),(2,2,NULL,'ACTIVE','2026-07-17','Student admission created',NULL,'2026-07-17 23:20:53'),(3,3,NULL,'ACTIVE','2026-07-18','Student admission created',NULL,'2026-07-18 03:11:56');
/*!40000 ALTER TABLE `student_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_transport_assignments`
--

DROP TABLE IF EXISTS `student_transport_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_transport_assignments` (
  `transport_assignment_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `route_id` bigint NOT NULL,
  `stop_id` bigint DEFAULT NULL,
  `start_date` date NOT NULL DEFAULT (curdate()),
  `end_date` date DEFAULT NULL,
  `monthly_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transport_assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_transport_assignments`
--

LOCK TABLES `student_transport_assignments` WRITE;
/*!40000 ALTER TABLE `student_transport_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_transport_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `student_no` varchar(50) NOT NULL,
  `admission_no` varchar(50) DEFAULT NULL,
  `registration_no` varchar(80) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `full_name` varchar(180) GENERATED ALWAYS AS (trim(concat(coalesce(`first_name`,_utf8mb4''),_utf8mb4' ',coalesce(`last_name`,_utf8mb4'')))) STORED,
  `gender` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `birth_certificate_no` varchar(80) DEFAULT NULL,
  `nid_no` varchar(80) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `nationality` varchar(80) DEFAULT 'Bangladeshi',
  `photo_url` text,
  `mobile` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `uk_students_no` (`institution_id`,`student_no`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_students_inst_status` (`institution_id`,`status`),
  FULLTEXT KEY `idx_students_name` (`first_name`,`last_name`),
  CONSTRAINT `chk_students_gender` CHECK (((`gender` is null) or (`gender` in (_utf8mb4'MALE',_utf8mb4'FEMALE',_utf8mb4'OTHER'))))
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` (`student_id`, `institution_id`, `user_id`, `student_no`, `admission_no`, `registration_no`, `first_name`, `last_name`, `gender`, `date_of_birth`, `birth_certificate_no`, `nid_no`, `blood_group`, `religion`, `nationality`, `photo_url`, `mobile`, `email`, `status`, `created_at`, `updated_at`) VALUES (3,1,NULL,'Stu1','adm1','1458896','Shadiqur','Rahman','MALE','1998-12-30','4569698888','456655444','AB-','Islam','Bangladeshi','/uploads/students/Stu1-student-photo-1784322742001-sadiq.jpg','0152566655574','sadiq@gmail.com','ACTIVE','2026-07-18 03:11:56','2026-07-18 03:26:24'),(4,1,NULL,'STU0004','ADM-2026-0004','REG-2026-000004','Arafat','Rahman','MALE','2005-04-08','20011000000000001',NULL,'A+','Islam','Bangladeshi',NULL,'01310000001','arafat.rahman4@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(5,1,NULL,'STU0005','ADM-2026-0005','REG-2026-000005','Tania','Islam','FEMALE','2005-07-14','20021000000000002',NULL,'B+','Islam','Bangladeshi',NULL,'01410000002','tania.islam5@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(6,1,NULL,'STU0006','ADM-2026-0006','REG-2026-000006','Sabbir','Hossain','MALE','2005-10-19','20031000000000003',NULL,'O+','Islam','Bangladeshi',NULL,'01510000003','sabbir.hossain6@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(7,1,NULL,'STU0007','ADM-2026-0007','REG-2026-000007','Sumaiya','Ahmed','FEMALE','2006-01-24','20041000000000004','1910000000004','AB+','Islam','Bangladeshi',NULL,'01610000004','sumaiya.ahmed7@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(8,1,NULL,'STU0008','ADM-2026-0008','REG-2026-000008','Nayeem','Khan','MALE','2006-05-01','20051000000000005',NULL,'A-','Islam','Bangladeshi',NULL,'01710000005','nayeem.khan8@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(9,1,NULL,'STU0009','ADM-2026-0009','REG-2026-000009','Raisa','Akter','FEMALE','2006-08-06','20061000000000006',NULL,'B-','Islam','Bangladeshi',NULL,'01810000006','raisa.akter9@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(10,1,NULL,'STU0010','ADM-2026-0010','REG-2026-000010','Fahim','Sultana','MALE','2006-11-11','20071000000000007',NULL,'O-','Hinduism','Bangladeshi',NULL,'01910000007','fahim.sultana10@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(11,1,NULL,'STU0011','ADM-2026-0011','REG-2026-000011','Afrin','Jahan','FEMALE','2007-02-16','20081000000000008','1910000000008','AB-','Hinduism','Bangladeshi',NULL,'01310000008','afrin.jahan11@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(12,1,NULL,'STU0012','ADM-2026-0012','REG-2026-000012','Imran','Mia','MALE','2007-05-24','20091000000000009',NULL,'A+','Christianity','Bangladeshi',NULL,'01410000009','imran.mia12@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(13,1,NULL,'STU0013','ADM-2026-0013','REG-2026-000013','Ritu','Chowdhury','FEMALE','2007-08-29','20001000000000010',NULL,'B+','Buddhism','Bangladeshi',NULL,'01510000010','ritu.chowdhury13@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(14,1,NULL,'STU0014','ADM-2026-0014','REG-2026-000014','Sakib','Hasan','MALE','2007-12-04','20011000000000011',NULL,'O+','Islam','Bangladeshi',NULL,'01610000011','sakib.hasan14@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(15,1,NULL,'STU0015','ADM-2026-0015','REG-2026-000015','Farzana','Alam','FEMALE','2008-03-10','20021000000000012','1910000000012','AB+','Islam','Bangladeshi',NULL,'01710000012','farzana.alam15@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(16,1,NULL,'STU0016','ADM-2026-0016','REG-2026-000016','Jubayer','Karim','MALE','2008-06-15','20031000000000013',NULL,'A-','Islam','Bangladeshi',NULL,'01810000013','jubayer.karim16@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(17,1,NULL,'STU0017','ADM-2026-0017','REG-2026-000017','Sharmin','Haque','FEMALE','2008-09-20','20041000000000014',NULL,'B-','Islam','Bangladeshi',NULL,'01910000014','sharmin.haque17@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(18,1,NULL,'STU0018','ADM-2026-0018','REG-2026-000018','Adnan','Das','MALE','2008-12-26','20051000000000015',NULL,'O-','Islam','Bangladeshi',NULL,'01310000015','adnan.das18@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(19,1,NULL,'STU0019','ADM-2026-0019','REG-2026-000019','Tasnim','Roy','FEMALE','2009-04-02','20061000000000016','1910000000016','AB-','Islam','Bangladeshi',NULL,'01410000016','tasnim.roy19@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(20,1,NULL,'STU0020','ADM-2026-0020','REG-2026-000020','Rasel','Barua','MALE','2009-07-08','20071000000000017',NULL,'A+','Hinduism','Bangladeshi',NULL,'01510000017','rasel.barua20@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(21,1,NULL,'STU0021','ADM-2026-0021','REG-2026-000021','Puja','Gomes','FEMALE','2009-10-13','20081000000000018',NULL,'B+','Hinduism','Bangladeshi',NULL,'01610000018','puja.gomes21@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(22,1,NULL,'STU0022','ADM-2026-0022','REG-2026-000022','Mehedi','Talukder','MALE','2010-01-18','20091000000000019',NULL,'O+','Christianity','Bangladeshi',NULL,'01710000019','mehedi.talukder22@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(23,1,NULL,'STU0023','ADM-2026-0023','REG-2026-000023','Sanjida','Sarkar','FEMALE','2010-04-25','20001000000000020','1910000000020','AB+','Buddhism','Bangladeshi',NULL,'01810000020','sanjida.sarkar23@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(24,1,NULL,'STU0024','ADM-2026-0024','REG-2026-000024','Arafat','Rahman','MALE','2010-07-31','20011000000000021',NULL,'A-','Islam','Bangladeshi',NULL,'01910000021','arafat.rahman24@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(25,1,NULL,'STU0025','ADM-2026-0025','REG-2026-000025','Tania','Islam','FEMALE','2010-11-05','20021000000000022',NULL,'B-','Islam','Bangladeshi',NULL,'01310000022','tania.islam25@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(26,1,NULL,'STU0026','ADM-2026-0026','REG-2026-000026','Sabbir','Hossain','MALE','2011-02-10','20031000000000023',NULL,'O-','Islam','Bangladeshi',NULL,'01410000023','sabbir.hossain26@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(27,1,NULL,'STU0027','ADM-2026-0027','REG-2026-000027','Sumaiya','Ahmed','FEMALE','2011-05-18','20041000000000024','1910000000024','AB-','Islam','Bangladeshi',NULL,'01510000024','sumaiya.ahmed27@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(28,1,NULL,'STU0028','ADM-2026-0028','REG-2026-000028','Nayeem','Khan','MALE','2011-08-23','20051000000000025',NULL,'A+','Islam','Bangladeshi',NULL,'01610000025','nayeem.khan28@example.com','INACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(29,1,NULL,'STU0029','ADM-2026-0029','REG-2026-000029','Raisa','Akter','FEMALE','2011-11-28','20061000000000026',NULL,'B+','Islam','Bangladeshi',NULL,'01710000026','raisa.akter29@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(30,1,NULL,'STU0030','ADM-2026-0030','REG-2026-000030','Fahim','Sultana','MALE','2005-03-06','20071000000000027',NULL,'O+','Hinduism','Bangladeshi',NULL,'01810000027','fahim.sultana30@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(31,1,NULL,'STU0031','ADM-2026-0031','REG-2026-000031','Afrin','Jahan','FEMALE','2005-06-11','20081000000000028','1910000000028','AB+','Hinduism','Bangladeshi',NULL,'01910000028','afrin.jahan31@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(32,1,NULL,'STU0032','ADM-2026-0032','REG-2026-000032','Imran','Mia','MALE','2005-09-16','20091000000000029',NULL,'A-','Christianity','Bangladeshi',NULL,'01310000029','imran.mia32@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(33,1,NULL,'STU0033','ADM-2026-0033','REG-2026-000033','Ritu','Chowdhury','FEMALE','2005-12-22','20001000000000030',NULL,'B-','Buddhism','Bangladeshi',NULL,'01410000030','ritu.chowdhury33@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(34,1,NULL,'STU0034','ADM-2026-0034','REG-2026-000034','Sakib','Hasan','MALE','2006-03-29','20011000000000031',NULL,'O-','Islam','Bangladeshi',NULL,'01510000031','sakib.hasan34@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(35,1,NULL,'STU0035','ADM-2026-0035','REG-2026-000035','Farzana','Alam','FEMALE','2006-07-04','20021000000000032','1910000000032','AB-','Islam','Bangladeshi',NULL,'01610000032','farzana.alam35@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(36,1,NULL,'STU0036','ADM-2026-0036','REG-2026-000036','Jubayer','Karim','MALE','2006-10-09','20031000000000033',NULL,'A+','Islam','Bangladeshi',NULL,'01710000033','jubayer.karim36@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(37,1,NULL,'STU0037','ADM-2026-0037','REG-2026-000037','Sharmin','Haque','FEMALE','2007-01-14','20041000000000034',NULL,'B+','Islam','Bangladeshi',NULL,'01810000034','sharmin.haque37@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(38,1,NULL,'STU0038','ADM-2026-0038','REG-2026-000038','Adnan','Das','MALE','2007-04-21','20051000000000035',NULL,'O+','Islam','Bangladeshi',NULL,'01910000035','adnan.das38@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(39,1,NULL,'STU0039','ADM-2026-0039','REG-2026-000039','Tasnim','Roy','FEMALE','2007-07-27','20061000000000036','1910000000036','AB+','Islam','Bangladeshi',NULL,'01310000036','tasnim.roy39@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(40,1,NULL,'STU0040','ADM-2026-0040','REG-2026-000040','Rasel','Barua','MALE','2007-11-01','20071000000000037',NULL,'A-','Hinduism','Bangladeshi',NULL,'01410000037','rasel.barua40@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(41,1,NULL,'STU0041','ADM-2026-0041','REG-2026-000041','Puja','Gomes','FEMALE','2008-02-06','20081000000000038',NULL,'B-','Hinduism','Bangladeshi',NULL,'01510000038','puja.gomes41@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(42,1,NULL,'STU0042','ADM-2026-0042','REG-2026-000042','Mehedi','Talukder','MALE','2008-05-13','20091000000000039',NULL,'O-','Christianity','Bangladeshi',NULL,'01610000039','mehedi.talukder42@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(43,1,NULL,'STU0043','ADM-2026-0043','REG-2026-000043','Sanjida','Sarkar','FEMALE','2008-08-18','20001000000000040','1910000000040','AB-','Buddhism','Bangladeshi',NULL,'01710000040','sanjida.sarkar43@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(44,1,NULL,'STU0044','ADM-2026-0044','REG-2026-000044','Arafat','Rahman','MALE','2008-11-23','20011000000000041',NULL,'A+','Islam','Bangladeshi',NULL,'01810000041','arafat.rahman44@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(45,1,NULL,'STU0045','ADM-2026-0045','REG-2026-000045','Tania','Islam','FEMALE','2009-02-28','20021000000000042',NULL,'B+','Islam','Bangladeshi',NULL,'01910000042','tania.islam45@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(46,1,NULL,'STU0046','ADM-2026-0046','REG-2026-000046','Sabbir','Hossain','MALE','2009-06-05','20031000000000043',NULL,'O+','Islam','Bangladeshi',NULL,'01310000043','sabbir.hossain46@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(47,1,NULL,'STU0047','ADM-2026-0047','REG-2026-000047','Sumaiya','Ahmed','FEMALE','2009-09-10','20041000000000044','1910000000044','AB+','Islam','Bangladeshi',NULL,'01410000044','sumaiya.ahmed47@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(48,1,NULL,'STU0048','ADM-2026-0048','REG-2026-000048','Nayeem','Khan','MALE','2009-12-16','20051000000000045',NULL,'A-','Islam','Bangladeshi',NULL,'01510000045','nayeem.khan48@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(49,1,NULL,'STU0049','ADM-2026-0049','REG-2026-000049','Raisa','Akter','FEMALE','2010-03-23','20061000000000046',NULL,'B-','Islam','Bangladeshi',NULL,'01610000046','raisa.akter49@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(50,1,NULL,'STU0050','ADM-2026-0050','REG-2026-000050','Fahim','Sultana','MALE','2010-06-28','20071000000000047',NULL,'O-','Hinduism','Bangladeshi',NULL,'01710000047','fahim.sultana50@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(51,1,NULL,'STU0051','ADM-2026-0051','REG-2026-000051','Afrin','Jahan','FEMALE','2010-10-03','20081000000000048','1910000000048','AB-','Hinduism','Bangladeshi',NULL,'01810000048','afrin.jahan51@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(52,1,NULL,'STU0052','ADM-2026-0052','REG-2026-000052','Imran','Mia','MALE','2011-01-08','20091000000000049',NULL,'A+','Christianity','Bangladeshi',NULL,'01910000049','imran.mia52@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(53,1,NULL,'STU0053','ADM-2026-0053','REG-2026-000053','Ritu','Chowdhury','FEMALE','2011-04-15','20001000000000050',NULL,'B+','Buddhism','Bangladeshi',NULL,'01310000050','ritu.chowdhury53@example.com','INACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(54,1,NULL,'STU0054','ADM-2026-0054','REG-2026-000054','Sakib','Hasan','MALE','2011-07-21','20011000000000051',NULL,'O+','Islam','Bangladeshi',NULL,'01410000051','sakib.hasan54@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(55,1,NULL,'STU0055','ADM-2026-0055','REG-2026-000055','Farzana','Alam','FEMALE','2011-10-26','20021000000000052','1910000000052','AB+','Islam','Bangladeshi',NULL,'01510000052','farzana.alam55@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(56,1,NULL,'STU0056','ADM-2026-0056','REG-2026-000056','Jubayer','Karim','MALE','2005-02-01','20031000000000053',NULL,'A-','Islam','Bangladeshi',NULL,'01610000053','jubayer.karim56@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(57,1,NULL,'STU0057','ADM-2026-0057','REG-2026-000057','Sharmin','Haque','FEMALE','2005-05-09','20041000000000054',NULL,'B-','Islam','Bangladeshi',NULL,'01710000054','sharmin.haque57@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(58,1,NULL,'STU0058','ADM-2026-0058','REG-2026-000058','Adnan','Das','MALE','2005-08-14','20051000000000055',NULL,'O-','Islam','Bangladeshi',NULL,'01810000055','adnan.das58@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(59,1,NULL,'STU0059','ADM-2026-0059','REG-2026-000059','Tasnim','Roy','FEMALE','2005-11-19','20061000000000056','1910000000056','AB-','Islam','Bangladeshi',NULL,'01910000056','tasnim.roy59@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(60,1,NULL,'STU0060','ADM-2026-0060','REG-2026-000060','Rasel','Barua','MALE','2006-02-24','20071000000000057',NULL,'A+','Hinduism','Bangladeshi',NULL,'01310000057','rasel.barua60@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(61,1,NULL,'STU0061','ADM-2026-0061','REG-2026-000061','Puja','Gomes','FEMALE','2006-06-01','20081000000000058',NULL,'B+','Hinduism','Bangladeshi',NULL,'01410000058','puja.gomes61@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(62,1,NULL,'STU0062','ADM-2026-0062','REG-2026-000062','Mehedi','Talukder','MALE','2006-09-06','20091000000000059',NULL,'O+','Christianity','Bangladeshi',NULL,'01510000059','mehedi.talukder62@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(63,1,NULL,'STU0063','ADM-2026-0063','REG-2026-000063','Sanjida','Sarkar','FEMALE','2006-12-12','20001000000000060','1910000000060','AB+','Buddhism','Bangladeshi',NULL,'01610000060','sanjida.sarkar63@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(64,1,NULL,'STU0064','ADM-2026-0064','REG-2026-000064','Arafat','Rahman','MALE','2007-03-19','20011000000000061',NULL,'A-','Islam','Bangladeshi',NULL,'01710000061','arafat.rahman64@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(65,1,NULL,'STU0065','ADM-2026-0065','REG-2026-000065','Tania','Islam','FEMALE','2007-06-24','20021000000000062',NULL,'B-','Islam','Bangladeshi',NULL,'01810000062','tania.islam65@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(66,1,NULL,'STU0066','ADM-2026-0066','REG-2026-000066','Sabbir','Hossain','MALE','2007-09-29','20031000000000063',NULL,'O-','Islam','Bangladeshi',NULL,'01910000063','sabbir.hossain66@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(67,1,NULL,'STU0067','ADM-2026-0067','REG-2026-000067','Sumaiya','Ahmed','FEMALE','2008-01-04','20041000000000064','1910000000064','AB-','Islam','Bangladeshi',NULL,'01310000064','sumaiya.ahmed67@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(68,1,NULL,'STU0068','ADM-2026-0068','REG-2026-000068','Nayeem','Khan','MALE','2008-04-10','20051000000000065',NULL,'A+','Islam','Bangladeshi',NULL,'01410000065','nayeem.khan68@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(69,1,NULL,'STU0069','ADM-2026-0069','REG-2026-000069','Raisa','Akter','FEMALE','2008-07-16','20061000000000066',NULL,'B+','Islam','Bangladeshi',NULL,'01510000066','raisa.akter69@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(70,1,NULL,'STU0070','ADM-2026-0070','REG-2026-000070','Fahim','Sultana','MALE','2008-10-21','20071000000000067',NULL,'O+','Hinduism','Bangladeshi',NULL,'01610000067','fahim.sultana70@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(71,1,NULL,'STU0071','ADM-2026-0071','REG-2026-000071','Afrin','Jahan','FEMALE','2009-01-26','20081000000000068','1910000000068','AB+','Hinduism','Bangladeshi',NULL,'01710000068','afrin.jahan71@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(72,1,NULL,'STU0072','ADM-2026-0072','REG-2026-000072','Imran','Mia','MALE','2009-05-03','20091000000000069',NULL,'A-','Christianity','Bangladeshi',NULL,'01810000069','imran.mia72@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(73,1,NULL,'STU0073','ADM-2026-0073','REG-2026-000073','Ritu','Chowdhury','FEMALE','2009-08-08','20001000000000070',NULL,'B-','Buddhism','Bangladeshi',NULL,'01910000070','ritu.chowdhury73@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(74,1,NULL,'STU0074','ADM-2026-0074','REG-2026-000074','Sakib','Hasan','MALE','2009-11-13','20011000000000071',NULL,'O-','Islam','Bangladeshi',NULL,'01310000071','sakib.hasan74@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(75,1,NULL,'STU0075','ADM-2026-0075','REG-2026-000075','Farzana','Alam','FEMALE','2010-02-18','20021000000000072','1910000000072','AB-','Islam','Bangladeshi',NULL,'01410000072','farzana.alam75@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(76,1,NULL,'STU0076','ADM-2026-0076','REG-2026-000076','Jubayer','Karim','MALE','2010-05-26','20031000000000073',NULL,'A+','Islam','Bangladeshi',NULL,'01510000073','jubayer.karim76@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(77,1,NULL,'STU0077','ADM-2026-0077','REG-2026-000077','Sharmin','Haque','FEMALE','2010-08-31','20041000000000074',NULL,'B+','Islam','Bangladeshi',NULL,'01610000074','sharmin.haque77@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(78,1,NULL,'STU0078','ADM-2026-0078','REG-2026-000078','Adnan','Das','MALE','2010-12-06','20051000000000075',NULL,'O+','Islam','Bangladeshi',NULL,'01710000075','adnan.das78@example.com','INACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(79,1,NULL,'STU0079','ADM-2026-0079','REG-2026-000079','Tasnim','Roy','FEMALE','2011-03-13','20061000000000076','1910000000076','AB+','Islam','Bangladeshi',NULL,'01810000076','tasnim.roy79@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(80,1,NULL,'STU0080','ADM-2026-0080','REG-2026-000080','Rasel','Barua','MALE','2011-06-18','20071000000000077',NULL,'A-','Hinduism','Bangladeshi',NULL,'01910000077','rasel.barua80@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(81,1,NULL,'STU0081','ADM-2026-0081','REG-2026-000081','Puja','Gomes','FEMALE','2011-09-23','20081000000000078',NULL,'B-','Hinduism','Bangladeshi',NULL,'01310000078','puja.gomes81@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(82,1,NULL,'STU0082','ADM-2026-0082','REG-2026-000082','Mehedi','Talukder','MALE','2011-12-29','20091000000000079',NULL,'O-','Christianity','Bangladeshi',NULL,'01410000079','mehedi.talukder82@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(83,1,NULL,'STU0083','ADM-2026-0083','REG-2026-000083','Sanjida','Sarkar','FEMALE','2005-04-06','20001000000000080','1910000000080','AB-','Buddhism','Bangladeshi',NULL,'01510000080','sanjida.sarkar83@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(84,1,NULL,'STU0084','ADM-2026-0084','REG-2026-000084','Arafat','Rahman','MALE','2005-07-12','20011000000000081',NULL,'A+','Islam','Bangladeshi',NULL,'01610000081','arafat.rahman84@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(85,1,NULL,'STU0085','ADM-2026-0085','REG-2026-000085','Tania','Islam','FEMALE','2005-10-17','20021000000000082',NULL,'B+','Islam','Bangladeshi',NULL,'01710000082','tania.islam85@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(86,1,NULL,'STU0086','ADM-2026-0086','REG-2026-000086','Sabbir','Hossain','MALE','2006-01-22','20031000000000083',NULL,'O+','Islam','Bangladeshi',NULL,'01810000083','sabbir.hossain86@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(87,1,NULL,'STU0087','ADM-2026-0087','REG-2026-000087','Sumaiya','Ahmed','FEMALE','2006-04-29','20041000000000084','1910000000084','AB+','Islam','Bangladeshi',NULL,'01910000084','sumaiya.ahmed87@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(88,1,NULL,'STU0088','ADM-2026-0088','REG-2026-000088','Nayeem','Khan','MALE','2006-08-04','20051000000000085',NULL,'A-','Islam','Bangladeshi',NULL,'01310000085','nayeem.khan88@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(89,1,NULL,'STU0089','ADM-2026-0089','REG-2026-000089','Raisa','Akter','FEMALE','2006-11-09','20061000000000086',NULL,'B-','Islam','Bangladeshi',NULL,'01410000086','raisa.akter89@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(90,1,NULL,'STU0090','ADM-2026-0090','REG-2026-000090','Fahim','Sultana','MALE','2007-02-14','20071000000000087',NULL,'O-','Hinduism','Bangladeshi',NULL,'01510000087','fahim.sultana90@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(91,1,NULL,'STU0091','ADM-2026-0091','REG-2026-000091','Afrin','Jahan','FEMALE','2007-05-22','20081000000000088','1910000000088','AB-','Hinduism','Bangladeshi',NULL,'01610000088','afrin.jahan91@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(92,1,NULL,'STU0092','ADM-2026-0092','REG-2026-000092','Imran','Mia','MALE','2007-08-27','20091000000000089',NULL,'A+','Christianity','Bangladeshi',NULL,'01710000089','imran.mia92@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(93,1,NULL,'STU0093','ADM-2026-0093','REG-2026-000093','Ritu','Chowdhury','FEMALE','2007-12-02','20001000000000090',NULL,'B+','Buddhism','Bangladeshi',NULL,'01810000090','ritu.chowdhury93@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(94,1,NULL,'STU0094','ADM-2026-0094','REG-2026-000094','Sakib','Hasan','MALE','2008-03-08','20011000000000091',NULL,'O+','Islam','Bangladeshi',NULL,'01910000091','sakib.hasan94@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(95,1,NULL,'STU0095','ADM-2026-0095','REG-2026-000095','Farzana','Alam','FEMALE','2008-06-13','20021000000000092','1910000000092','AB+','Islam','Bangladeshi',NULL,'01310000092','farzana.alam95@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(96,1,NULL,'STU0096','ADM-2026-0096','REG-2026-000096','Jubayer','Karim','MALE','2008-09-18','20031000000000093',NULL,'A-','Islam','Bangladeshi',NULL,'01410000093','jubayer.karim96@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(97,1,NULL,'STU0097','ADM-2026-0097','REG-2026-000097','Sharmin','Haque','FEMALE','2008-12-24','20041000000000094',NULL,'B-','Islam','Bangladeshi',NULL,'01510000094','sharmin.haque97@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(98,1,NULL,'STU0098','ADM-2026-0098','REG-2026-000098','Adnan','Das','MALE','2009-03-31','20051000000000095',NULL,'O-','Islam','Bangladeshi',NULL,'01610000095','adnan.das98@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(99,1,NULL,'STU0099','ADM-2026-0099','REG-2026-000099','Tasnim','Roy','FEMALE','2009-07-06','20061000000000096','1910000000096','AB-','Islam','Bangladeshi',NULL,'01710000096','tasnim.roy99@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(100,1,NULL,'STU0100','ADM-2026-0100','REG-2026-000100','Rasel','Barua','MALE','2009-10-11','20071000000000097',NULL,'A+','Hinduism','Bangladeshi',NULL,'01810000097','rasel.barua100@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(101,1,NULL,'STU0101','ADM-2026-0101','REG-2026-000101','Puja','Gomes','FEMALE','2010-01-16','20081000000000098',NULL,'B+','Hinduism','Bangladeshi',NULL,'01910000098','puja.gomes101@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(102,1,NULL,'STU0102','ADM-2026-0102','REG-2026-000102','Mehedi','Talukder','MALE','2010-04-23','20091000000000099',NULL,'O+','Christianity','Bangladeshi',NULL,'01310000099','mehedi.talukder102@example.com','ACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20'),(103,1,NULL,'STU0103','ADM-2026-0103','REG-2026-000103','Sanjida','Sarkar','FEMALE','2010-07-29','20001000000000100','1910000000100','AB+','Buddhism','Bangladeshi',NULL,'01410000100','sanjida.sarkar103@example.com','INACTIVE','2026-07-18 19:47:20','2026-07-18 19:47:20');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_students_updated_at` BEFORE UPDATE ON `students` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `subject_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `subject_code` varchar(30) NOT NULL,
  `subject_name` varchar(150) NOT NULL,
  `subject_type` varchar(30) DEFAULT 'REGULAR',
  `full_marks` decimal(8,2) DEFAULT '100.00',
  `pass_marks` decimal(8,2) DEFAULT '33.00',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`subject_id`),
  UNIQUE KEY `uk_subjects` (`institution_id`,`subject_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint DEFAULT NULL,
  `branch_id` bigint DEFAULT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `setting_group` varchar(80) DEFAULT NULL,
  `is_encrypted` tinyint(1) NOT NULL DEFAULT '0',
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uk_system_settings` (`institution_id`,`branch_id`,`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_subject_assignments`
--

DROP TABLE IF EXISTS `teacher_subject_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_subject_assignments` (
  `assignment_id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `academic_year_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `subject_id` bigint NOT NULL,
  `is_class_teacher` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `uk_teacher_subject` (`employee_id`,`academic_year_id`,`batch_id`,`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_subject_assignments`
--

LOCK TABLES `teacher_subject_assignments` WRITE;
/*!40000 ALTER TABLE `teacher_subject_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_subject_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transport_routes`
--

DROP TABLE IF EXISTS `transport_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_routes` (
  `route_id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` bigint NOT NULL,
  `route_code` varchar(30) NOT NULL,
  `route_name` varchar(150) NOT NULL,
  `vehicle_id` bigint DEFAULT NULL,
  `monthly_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`route_id`),
  UNIQUE KEY `uk_transport_routes` (`branch_id`,`route_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transport_routes`
--

LOCK TABLES `transport_routes` WRITE;
/*!40000 ALTER TABLE `transport_routes` DISABLE KEYS */;
/*!40000 ALTER TABLE `transport_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transport_stops`
--

DROP TABLE IF EXISTS `transport_stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_stops` (
  `stop_id` bigint NOT NULL AUTO_INCREMENT,
  `route_id` bigint NOT NULL,
  `stop_name` varchar(150) NOT NULL,
  `stop_order` int DEFAULT '0',
  `pickup_time` time DEFAULT NULL,
  `drop_time` time DEFAULT NULL,
  `stop_fee` decimal(12,2) DEFAULT '0.00',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`stop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transport_stops`
--

LOCK TABLES `transport_stops` WRITE;
/*!40000 ALTER TABLE `transport_stops` DISABLE KEYS */;
/*!40000 ALTER TABLE `transport_stops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_role_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_role_id`),
  UNIQUE KEY `uk_user_roles_branch` (`user_id`,`role_id`,`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (5,2,1,NULL,'2026-06-11 01:48:05'),(7,1,3,NULL,'2026-06-11 02:12:47'),(9,2,3,NULL,'2026-07-17 21:56:35');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `session_id` char(36) NOT NULL DEFAULT (uuid()),
  `user_id` bigint NOT NULL,
  `refresh_token_hash` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `vehicle_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `vehicle_no` varchar(50) NOT NULL,
  `vehicle_type` varchar(50) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `driver_name` varchar(150) DEFAULT NULL,
  `driver_mobile` varchar(30) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vehicle_id`),
  UNIQUE KEY `uk_vehicles` (`institution_id`,`vehicle_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_vehicles_updated_at` BEFORE UPDATE ON `vehicles` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `vendor_id` bigint NOT NULL AUTO_INCREMENT,
  `institution_id` bigint NOT NULL,
  `vendor_code` varchar(30) NOT NULL,
  `vendor_name` varchar(150) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address_line` text,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vendor_id`),
  UNIQUE KEY `uk_vendors` (`institution_id`,`vendor_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`sadiq`@`%`*/ /*!50003 TRIGGER `trg_vendors_updated_at` BEFORE UPDATE ON `vendors` FOR EACH ROW BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-18 23:28:38
