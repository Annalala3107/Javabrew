---
title: Authorization System Design Explained
description: "Role-Based Access Control (RBAC) grants permissions to users through their assigned roles, achieving flexible access control that is simpler, more efficient, and more scalable than assigning permissions directly to individual users."
category: System Design
tag:
  - Security
head:
  - - meta
    - name: keywords
      content: Authorization System Design,RBAC,ABAC,User Role Permissions,Resource Permissions,Permission Model,Permission Verification,Authorization System
lang: en
sourceRef: zh-ref/system-design/security/design-of-authority-system.md
---

> Author: Zhuanzhuan Engineering Team
>
> Original article: <https://mp.weixin.qq.com/s/ONMuELjdHYa0yQceTj01Iw>

## Problems and Current State of Legacy Authorization Systems

In the past, Zhuanzhuan did not have a unified authorization management system. Permission management was either developed independently by each business line or borrowed from other business lines' authorization systems. This lack of unification brought several problems:

1. Each business line reinvented the wheel, resulting in high maintenance costs.
2. Each system only solved a subset of scenarios; the solutions were not general-purpose, leaving new projects without a reliable authorization management option when choosing a stack.
3. There was a lack of unified log management and approval workflows, making it very difficult to trace authorization records.

Based on these issues, at the end of last year the company launched the development of Zhuanzhuan's Unified Authorization System, aiming to build a flexible, easy-to-use, and secure authorization management system for all business lines.

## Industry Approaches to Authorization System Design

Currently, there are two mainstream permission models in the industry, introduced below:

- **Role-Based Access Control (RBAC)**
- **Attribute-Based Access Control (ABAC)**

### The RBAC Model

**Role-Based Access Control (RBAC)** grants relevant permissions to users through their assigned roles (`Role`), achieving flexible access control that is simpler, more efficient, and more extensible than directly assigning permissions to individual users.

A user can hold multiple roles, and each role can be assigned multiple permissions—forming a `"User - Role - Permission"` authorization model. In this model, there are many-to-many relationships between users and roles, and between roles and permissions.

This can be illustrated as follows:

![RBAC Permission Model Diagram](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/rbac-a304d5af.png)

When using the `RBAC` model, by analyzing users' actual situations and grouping them based on shared responsibilities and requirements, we grant them different roles. This `User -> Role -> Permission` relationship eliminates the need to manage permissions for every individual user separately—users inherit the required permissions from their assigned roles.

Take a simple scenario (GitLab's permission system) as an example. The user system has three roles: `Admin`, `Maintainer`, and `Operator`. These three roles carry different permissions—for instance, only `Admin` has permissions to create and delete code repositories, while the other roles do not. When we grant a user the `Admin` role, that user acquires both the **create code repository** and **delete code repository** permissions.

With the `RBAC` model, when multiple users share the same set of permissions, we only need to create a role with those permissions and assign different roles to different users. Later, modifying the permissions of a role automatically updates the permissions of all users holding that role.

### The ABAC Model

**Attribute-Based Access Control (ABAC)** is an authorization model that is even more flexible than `RBAC`. Its principle is to dynamically evaluate whether an operation should be permitted based on various attributes. This model is widely used in cloud platforms such as AWS and Alibaba Cloud.

Consider access control for the following scenarios:

1. Grant a specific person edit permission on a specific book.
2. Allow a user to access a document when the document's owning department matches the user's department.
3. Allow a user to edit a document when the user is the owner of the document and the document's status is draft.
4. Prohibit members of Department A from accessing System B before 9:00 AM.
5. Prohibit logging into System A with administrator privileges from anywhere outside Shanghai.
6. Grant a user operational permissions only for orders created before `2022-06-07`.

As you can see, these scenarios are difficult to implement using the `RBAC` model alone, because `RBAC` only describes what operations a user can perform—it has no built-in constraints for the conditions of the operation or the specific data being operated on. That is precisely where `ABAC` excels: the core idea of `ABAC` is to dynamically compute whether a user is authorized to perform an action based on attributes of the user, attributes of the accessed data, and various environmental factors.

#### How the ABAC Model Works

In the `ABAC` model, whether an operation is allowed is dynamically computed based on four components: Subject, Resource, Action, and Environment.

- **Subject:** The user currently requesting access to a resource. User attributes include ID, personal resources, roles, department, organizational membership, etc.
- **Resource:** The asset or object the user wants to access, such as files, data, servers, or even APIs.
- **Action:** The operation the user attempts to perform on the resource. Common actions include "read", "write", "edit", "copy", and "delete".
- **Environment:** The context of each access request. Environment attributes include the time and location of access, the subject's device, communication protocol, encryption strength, etc.

During policy evaluation in the `ABAC` model, the decision engine dynamically computes an authorization decision using predefined policy statements combined with Subject, Resource, Action, Environment, and other factors. Whenever an access request occurs, the `ABAC` decision system analyzes whether the attribute values match the established policies. If a matching policy permits it, the access request is approved.

## Design Philosophy of the New Authorization System

Considering Zhuanzhuan's actual business needs, the `RBAC` model satisfies the vast majority of business scenarios while keeping development costs much lower than an `ABAC`-based system. Therefore, the new authorization system was implemented based on the `RBAC` model. For the few business systems whose requirements truly cannot be met by RBAC, we temporarily chose not to support them, ensuring rapid delivery of the new authorization system so business teams could adopt it quickly.

The standard `RBAC` model strictly follows the `User -> Role -> Permission` chain, meaning a user's permissions are controlled exclusively by the roles they hold. However, this has a drawback: adding a single extra permission for a user requires creating a new role, which makes day-to-day operations inefficient. Therefore, on top of the `RBAC` model, we added the ability to grant permissions directly to a user—meaning you can assign roles to a user AND directly assign individual permissions to a user. A user's effective permissions are composed of both their roles and their directly assigned permission points.

**Permission model of the new authorization system:** User's effective permissions = permissions inherited from the user's roles + permissions independently configured for the user (taking the union of both).

The architecture of the new authorization system is shown below:

![New Authorization System Architecture](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-design-c2357b34.png)

- First, all users across the group (including external users) are managed uniformly through **Unified Login and Registration**, integrated with the company's organizational structure module. This ensures consistent identity information for the same person across all systems and lays the groundwork for future organization-based permission management.
- Second, since the new authorization system needs to serve all business lines across the group, it must support multi-system permission management. Before managing permissions, a user selects the target system and configures its **Menu Permissions** and **Data Permissions**, establishing all permission points for that system. _Note: Details of menu permissions and data permissions are explained below._
- Finally, different roles are created under that system and assigned specific permission points. For example, a Store Manager role has store staff operation permissions, viewing permissions for that store's data, etc. Once this role is configured, any store manager only needs to be granted this role to receive all corresponding permissions.

After completing the above configuration, user permission management can proceed. There are two ways to grant permissions to users:

1. Select a user first, then add permissions. This approach allows adding any role as well as individual menu/data permission points to the user.
2. Select a role first, then associate users. This approach can only assign roles to users and cannot assign individual menu/data permission points separately.

The detailed design for both approaches is described later in this article.

### Self-Management of the Authorization System

For an authorization system, we must first design its own access control—that is, managing "who can enter the authorization system and who can manage permissions for other systems." Users of the authorization system itself are divided into three categories:

1. **Super Administrator:** Has full operational permissions over the authorization system itself, can perform any system-level operations, and can manage administrative operations for all integrated application systems.
2. **Permission Operator:** A user who holds the Super Administrator role in at least one integrated application system. The operations this user can perform are restricted to the scope of the application systems they administer. Permission Operator is an automatically derived status rather than a manually assigned role, granted automatically based on rules.
3. **Regular User:** Regular User can also be regarded as an identity status; everyone outside the two categories above is a Regular User. They can only apply to onboard a system or access the permission request page.

### Definition of Permission Types

In the new authorization system, permissions are divided into two major categories:

- **Menu & Feature Permissions:** Includes access permissions for system top-level directories and menus, as well as permissions for button and API operations.
- **Data Permissions:** Includes permissions defining the query scope of data. Across different systems, this is often called "Organization", "Site", etc. In the new authorization system, it is uniformly termed "Organization" for managing data permissions.

### Classification of Default Roles

Three default roles are designed for every onboarded system to meet basic permission management requirements:

- **Super Administrator:** Holds all permissions in the system, can modify the system's role/permission configurations, and can grant permissions to other users.
- **System Administrator:** Has the ability to grant permissions to other users and modify the system's role/permission configurations, but the role itself does not possess any business permissions.
- **Delegated Authorization Administrator:** Has the ability to grant permissions to other users, provided the scope of permissions granted does not exceed the permissions they themselves hold.

> Example: Delegated Authorization Administrator A can grant permissions to User B, but the granted scope must be less than or equal to the permissions User A already possesses.

Through this separation, **holding permissions** and **having the authority to grant permissions** are decoupled, covering all access control scenarios cleanly.

## Core Module Design of the New Authorization System

Having introduced the overall design philosophy of the new authorization system, let's look at the design of each core module.

### System / Menu / Data Permission Management

Onboarding a new system into the authorization system consists of the following steps:

1. Create the system
2. Configure menu and feature permissions
3. Configure data permissions (optional)
4. Create roles for the system

Steps 1, 2, and 3 are all completed in the System Management module, as shown in the workflow below:

![System Onboarding Flowchart](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-design-access-flow-chart-260abaf6.png)

Users can perform CRUD operations on basic system information. Different systems are uniquely distinguished by a `System Code`. Meanwhile, the `System Code` also serves as a prefix for menu and data permission codes, ensuring global uniqueness of permission codes.

For example, if a system's code is `test_online`, then its menu permission code format is `test_online:m_xxx`.

The System Management UI design is shown below:

![System Management Interface Design](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-management-interface-9a5a479e.png)

#### Menu Management

The new authorization system first categorizes menu items into `Directory`, `Menu`, and `Operation`, as illustrated below:

![Menu Management Diagram](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-menu-8987e965.png)

Their respective meanings are:

- **Directory:** Refers to the top-level navigation categories in an application system, typically located to the right of the system logo.
- **Menu:** Refers to the multi-level navigation menus on the left side of an application system, typically located below the system logo; this is the most common menu structure.
- **Operation:** Refers to buttons, API endpoints, and other elements on a page that can be defined as actionable operations or page elements.

The Menu Management UI design is shown below:

![Menu Management Interface Design](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/new-authority-system-menu-management-interface-68647206.png)

Two modes are provided for consuming menu permission data:

- **Dynamic Menu Mode:** In this mode, adding or deleting menus is completely managed by the authorization system. That is, adding a menu in the authorization system automatically adds it to the application system. The benefit is that modifying menus does not require deploying the application project.
- **Static Menu Mode:** Adding or deleting menus is controlled by the application's frontend, while the authorization system only controls access permissions. In this mode, the authorization system only indicates whether the user has permission for the current menu, and the frontend decides how to display it based on the permission data.

Special attention should be paid to this: hiding directories, menus, or buttons on the frontend only improves user experience and **must never** serve as a real security boundary. Regardless of whether dynamic or static menu mode is used, the backend must deny ungranted access by default and validate on every request whether the current user is authorized to perform the corresponding operation. When specific data is involved, the backend must also verify resource ownership, tenant, organization, and data scope—it must never check only whether the user has access to a menu, nor trust client-supplied user IDs, organization IDs, or resource IDs.

### Role and User Management

Role Management and User Management are the core modules that directly alter user permissions. The overall design approach is illustrated below:

![Role and User Management Module Design](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/role-and-user-management-b5d867fa.png)

The key design focus for this module is supporting **batch operations**. Whether associating users via roles or batch-adding/removing/resetting permissions for users, batch operation scenarios must be thoughtfully designed into the system.

### Permission Requests

In addition to administrators granting permissions to other users, the new authorization system also supports self-service permission requests by users. Aside from standard approval workflows (apply, approve, view), this module includes a particularly useful feature: helping users accurately pick the permissions they actually need. Therefore, in addition to selecting roles directly, this module supports reverse-selecting roles based on menu/data permission points, as shown below:

![Permission Request Interface](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/permission-application-6c729eaf.png)

### Operation Logs

System operation logs are divided into two categories:

1. **Operation Audit Logs:** Key operation logs that are readable and searchable by users.
2. **Service Logs:** System logs generated during service runtime. Service logs contain far more detailed information than operation audit logs, but are inconvenient to search and inspect. Therefore, the authorization system needs to provide a dedicated operation audit log feature.

In the new authorization system, all user operations fall into three categories: Create, Update, and Delete. All modules are enumerable as well, such as User Management, Role Management, Menu Management, etc. With this information defined, an audit log entry can be abstracted as: **Who** performed **What action** on **Which module** of **Which target** at **What time**.
Storing all such records in the database makes viewing and filtering logs straightforward.

## Summary and Outlook

At this point, the core design philosophy and modules of the new authorization system have been covered. The new system has been adopted by a large number of business lines inside Zhuanzhuan, making permission management much more convenient than before. As a foundational infrastructure system in any company, a flexible and well-rounded authorization system can greatly accelerate future business growth.

Two follow-up articles:

- [Design and Implementation of Zhuanzhuan's Unified Authorization System (Backend Implementation)](https://mp.weixin.qq.com/s/hFTDckfxhSnoM_McP18Vkg)
- [Design and Implementation of Zhuanzhuan's Unified Authorization System (Frontend Implementation)](https://mp.weixin.qq.com/s/a_P4JAwxgunhfmJvpBnWYA)

## References

- OWASP Authorization Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- Choosing the Right Access Control Model: <https://docs.authing.cn/v2/guides/access-control/choose-the-right-access-control-model.html>
