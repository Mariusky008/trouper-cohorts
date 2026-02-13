export default function PrivacyPage() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Politique de Confidentialité</h1>
      <p className="text-sm text-muted-foreground">Dernière mise à jour : 13 Février 2026</p>
      
      <p>
        La protection de vos données personnelles est une priorité pour Popey Academy.
        Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations.
      </p>

      <h2>1. Responsable du Traitement</h2>
      <p>
        Le responsable du traitement des données est <strong>Popey Academy</strong>, domicilié à Paris, France.<br/>
        Email de contact : <a href="mailto:contact@popey.academy">contact@popey.academy</a>.
      </p>

      <h2>2. Données Collectées</h2>
      <p>
        Dans le cadre de l'utilisation de la plateforme, nous sommes amenés à collecter les données suivantes :
      </p>
      <ul>
        <li><strong>Données d'identification :</strong> Nom, prénom, adresse email, numéro de téléphone.</li>
        <li><strong>Données professionnelles :</strong> Métier, situation professionnelle, lien LinkedIn/Instagram.</li>
        <li><strong>Données de connexion :</strong> Logs, adresse IP, type de navigateur.</li>
        <li><strong>Données de paiement :</strong> Gérées exclusivement par notre prestataire sécurisé Stripe (nous ne stockons pas vos numéros de carte bancaire).</li>
      </ul>

      <h2>3. Finalités du Traitement</h2>
      <p>
        Vos données sont collectées pour les finalités suivantes :
      </p>
      <ul>
        <li>Gestion de votre inscription et de votre compte membre.</li>
        <li>Accès aux services de formation et aux contenus pédagogiques.</li>
        <li>Fonctionnement des fonctionnalités communautaires (annuaire, binômes, leaderboard).</li>
        <li>Communication concernant le suivi de votre formation et les nouveautés de la plateforme.</li>
        <li>Respect de nos obligations légales et réglementaires.</li>
      </ul>

      <h2>4. Destinataires des Données</h2>
      <p>
        Vos données sont destinées à l'équipe de Popey Academy.
        Certaines données (Nom, Prénom, Métier, Photo) peuvent être visibles par les autres membres de votre cohorte dans le cadre des fonctionnalités communautaires.
        Nous ne vendons, ne louons et ne cédons aucune de vos données personnelles à des tiers à des fins commerciales.
      </p>

      <h2>5. Durée de Conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif et pendant la durée nécessaire à la fourniture des services.
        Conformément à la loi, certaines données (facturation) peuvent être conservées plus longtemps à des fins de preuve comptable.
      </p>

      <h2>6. Vos Droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits suivants sur vos données :
      </p>
      <ul>
        <li>Droit d'accès et de rectification.</li>
        <li>Droit à l'effacement ("droit à l'oubli").</li>
        <li>Droit à la limitation du traitement.</li>
        <li>Droit à la portabilité des données.</li>
        <li>Droit d'opposition.</li>
      </ul>
      <p>
        Pour exercer ces droits, veuillez nous contacter par email à : <a href="mailto:contact@popey.academy">contact@popey.academy</a>.
      </p>

      <h2>7. Sécurité</h2>
      <p>
        Nous mettons en œuvre toutes les mesures techniques et organisationnelles nécessaires pour assurer la sécurité et la confidentialité de vos données personnelles et empêcher qu'elles ne soient déformées, endommagées ou que des tiers non autorisés y aient accès.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Lors de votre navigation sur le site, des cookies peuvent être déposés sur votre terminal. Ils servent principalement à :
      </p>
      <ul>
        <li>Gérer votre session utilisateur (connexion).</li>
        <li>Mesurer l'audience du site (statistiques anonymes).</li>
      </ul>
      <p>
        Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela pourrait altérer le bon fonctionnement de la plateforme.
      </p>
    </article>
  );
}
